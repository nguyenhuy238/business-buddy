using AutoMapper;
using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusinessBuddy.Application.Services;

/**
 * Service for purchase order operations
 * Handles business logic for purchase orders including receiving goods and payments
 */
public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PurchaseOrderService> _logger;

    public PurchaseOrderService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ApplicationDbContext context,
        ILogger<PurchaseOrderService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _context = context;
        _logger = logger;
    }

    /**
     * Get all purchase orders with optional filters
     */
    public async Task<(int Total, List<PurchaseOrderDto> Items)> GetAllAsync(
        Guid? supplierId = null,
        string? status = null,
        DateTime? from = null,
        DateTime? to = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.PurchaseOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Unit)
            .Include(o => o.Supplier)
            .AsQueryable();

        if (supplierId.HasValue)
        {
            query = query.Where(o => o.SupplierId == supplierId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<PurchaseOrderStatus>(status, true, out var statusEnum))
            {
                query = query.Where(o => o.Status == statusEnum);
            }
        }

        if (from.HasValue)
        {
            query = query.Where(o => o.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(o => o.CreatedAt <= to.Value.AddDays(1).AddTicks(-1));
        }

        var total = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var orderDtos = orders.Select(o => MapToDto(o)).ToList();

        return (total, orderDtos);
    }

    /**
     * Get a purchase order by ID
     */
    public async Task<PurchaseOrderDto?> GetByIdAsync(Guid id)
    {
        var order = await _context.PurchaseOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Unit)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return null;
        }

        return MapToDto(order);
    }

    /**
     * Create a new purchase order
     */
    public async Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto dto)
    {
        if (dto == null || dto.Items == null || dto.Items.Count == 0)
        {
            throw new ArgumentException("Purchase order must have at least one item", nameof(dto));
        }

        // Verify supplier exists
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(dto.SupplierId);
        if (supplier == null)
        {
            throw new ArgumentException($"Supplier with ID {dto.SupplierId} not found", nameof(dto.SupplierId));
        }

        // Create order
        var order = new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            SupplierId = dto.SupplierId,
            Status = ParseEnum<PurchaseOrderStatus>(dto.Status ?? "Draft", PurchaseOrderStatus.Draft),
            Discount = dto.Discount,
            DiscountType = ParseEnum<DiscountType>(dto.DiscountType ?? "Percent", DiscountType.Percent),
            PaymentMethod = ParseEnum<PaymentMethod>(dto.PaymentMethod ?? "Cash", PaymentMethod.Cash),
            PaidAmount = dto.PaidAmount,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Notes = dto.Notes,
            CreatedBy = dto.CreatedBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Generate order code
        var now = DateTime.UtcNow;
        var codePrefix = $"PO-{now:yyyyMMdd}-{now:HHmmss}";
        var existingCount = await _context.PurchaseOrders
            .CountAsync(o => o.Code.StartsWith(codePrefix));
        order.Code = $"{codePrefix}-{(existingCount + 1):D4}";

        // Create items
        decimal subtotal = 0;
        foreach (var itemDto in dto.Items)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
            if (product == null)
            {
                throw new ArgumentException($"Product with ID {itemDto.ProductId} not found", nameof(itemDto.ProductId));
            }

            var unit = await _unitOfWork.UnitOfMeasures.GetByIdAsync(itemDto.UnitId);
            if (unit == null)
            {
                throw new ArgumentException($"Unit with ID {itemDto.UnitId} not found", nameof(itemDto.UnitId));
            }

            // Calculate item total
            var itemSubtotal = itemDto.Quantity * itemDto.UnitPrice;
            decimal itemDiscountAmount = 0;
            if (itemDto.DiscountType == "Percent")
            {
                itemDiscountAmount = itemSubtotal * itemDto.Discount / 100;
            }
            else
            {
                itemDiscountAmount = itemDto.Discount;
            }
            var itemTotal = itemSubtotal - itemDiscountAmount;

            var item = new PurchaseOrderItem
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = order.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                ReceivedQuantity = 0,
                UnitId = itemDto.UnitId,
                UnitPrice = itemDto.UnitPrice,
                Discount = itemDto.Discount,
                DiscountType = ParseEnum<DiscountType>(itemDto.DiscountType ?? "Percent", DiscountType.Percent),
                Total = itemTotal,
                CreatedAt = DateTime.UtcNow
            };

            order.Items.Add(item);
            subtotal += itemTotal;
        }

        // Calculate order totals
        order.Subtotal = subtotal;
        decimal discountAmount = 0;
        if (order.DiscountType == DiscountType.Percent)
        {
            discountAmount = order.Subtotal * order.Discount / 100;
        }
        else
        {
            discountAmount = order.Discount;
        }
        order.Total = order.Subtotal - discountAmount;

        // Save order
        await _unitOfWork.PurchaseOrders.AddAsync(order);

        // If status is Ordered and payment method is Credit, create payable transaction
        if (order.Status == PurchaseOrderStatus.Ordered && order.PaymentMethod == PaymentMethod.Credit)
        {
            var debtAmount = order.Total - order.PaidAmount;
            if (debtAmount > 0)
            {
                var balanceBefore = supplier.Payables;
                var balanceAfter = balanceBefore + debtAmount;

                var payableTransaction = new PayableTransaction
                {
                    SupplierId = supplier.Id,
                    Type = PayableTransactionType.Invoice,
                    Amount = debtAmount,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    Description = string.IsNullOrWhiteSpace(order.Notes)
                        ? $"Đơn nhập hàng {order.Code}"
                        : $"Đơn nhập hàng {order.Code}: {order.Notes}",
                    PaymentMethod = PaymentMethod.Credit,
                    DueDate = order.ExpectedDeliveryDate,
                    TransactionDate = now,
                    ReferenceType = "PurchaseOrder",
                    ReferenceId = order.Id,
                    CreatedBy = dto.CreatedBy,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _unitOfWork.PayableTransactions.AddAsync(payableTransaction);

                supplier.Payables = balanceAfter;
                if (order.ExpectedDeliveryDate.HasValue)
                {
                    if (!supplier.PaymentDueDate.HasValue || supplier.PaymentDueDate.Value < order.ExpectedDeliveryDate.Value)
                    {
                        supplier.PaymentDueDate = order.ExpectedDeliveryDate.Value;
                    }
                }
                supplier.UpdatedAt = now;
                await _unitOfWork.Suppliers.UpdateAsync(supplier);
            }
        }

        // Create cashbook entry for non-credit payments when order is Ordered
        if (order.PaymentMethod != PaymentMethod.Credit && order.Status == PurchaseOrderStatus.Ordered && order.PaidAmount > 0)
        {
            var cashbookEntry = new CashbookEntry
            {
                Type = CashbookEntryType.Expense,
                Category = "Nhập hàng",
                Amount = order.PaidAmount,
                Description = string.IsNullOrWhiteSpace(order.Notes)
                    ? $"Nhập hàng - Đơn {order.Code}"
                    : $"Nhập hàng - Đơn {order.Code}: {order.Notes}",
                PaymentMethod = order.PaymentMethod,
                ReferenceType = "PurchaseOrder",
                ReferenceId = order.Id,
                TransactionDate = now,
                CreatedBy = dto.CreatedBy,
                CreatedAt = now
            };

            await _unitOfWork.CashbookEntries.AddAsync(cashbookEntry);
        }

        await _unitOfWork.SaveChangesAsync();

        // Reload order with all relationships
        var createdOrder = await _context.PurchaseOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Unit)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        if (createdOrder == null)
        {
            throw new InvalidOperationException("Failed to retrieve created purchase order");
        }

        return MapToDto(createdOrder);
    }

    /**
     * Update an existing purchase order
     */
    public async Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto dto)
    {
        var existing = await _context.PurchaseOrders
            .Include(o => o.Items)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (existing == null)
        {
            return null;
        }

        // Only allow editing draft orders
        if (existing.Status != PurchaseOrderStatus.Draft)
        {
            throw new InvalidOperationException("Only draft purchase orders can be edited");
        }

        var now = DateTime.UtcNow;

        // Update basic fields
        if (dto.SupplierId.HasValue)
        {
            var supplier = await _unitOfWork.Suppliers.GetByIdAsync(dto.SupplierId.Value);
            if (supplier == null)
            {
                throw new ArgumentException($"Supplier with ID {dto.SupplierId.Value} not found", nameof(dto.SupplierId));
            }
            existing.SupplierId = dto.SupplierId.Value;
        }

        if (dto.Discount.HasValue)
        {
            existing.Discount = dto.Discount.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.DiscountType))
        {
            existing.DiscountType = ParseEnum<DiscountType>(dto.DiscountType, DiscountType.Percent);
        }

        if (!string.IsNullOrWhiteSpace(dto.PaymentMethod))
        {
            existing.PaymentMethod = ParseEnum<PaymentMethod>(dto.PaymentMethod, PaymentMethod.Cash);
        }

        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            existing.Status = ParseEnum<PurchaseOrderStatus>(dto.Status, PurchaseOrderStatus.Draft);
        }

        if (dto.PaidAmount.HasValue)
        {
            existing.PaidAmount = dto.PaidAmount.Value;
        }

        if (dto.ExpectedDeliveryDate.HasValue)
        {
            existing.ExpectedDeliveryDate = dto.ExpectedDeliveryDate;
        }

        if (dto.Notes != null)
        {
            existing.Notes = dto.Notes;
        }

        // Update items if provided
        if (dto.Items != null && dto.Items.Count > 0)
        {
            // Remove existing items
            foreach (var item in existing.Items.ToList())
            {
                await _unitOfWork.PurchaseOrderItems.DeleteAsync(item);
            }
            existing.Items.Clear();

            // Add new items
            decimal subtotal = 0;
            foreach (var itemDto in dto.Items)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                {
                    throw new ArgumentException($"Product with ID {itemDto.ProductId} not found", nameof(itemDto.ProductId));
                }

                var unit = await _unitOfWork.UnitOfMeasures.GetByIdAsync(itemDto.UnitId);
                if (unit == null)
                {
                    throw new ArgumentException($"Unit with ID {itemDto.UnitId} not found", nameof(itemDto.UnitId));
                }

                // Calculate item total
                var itemSubtotal = itemDto.Quantity * itemDto.UnitPrice;
                decimal itemDiscountAmount = 0;
                if (itemDto.DiscountType == "Percent")
                {
                    itemDiscountAmount = itemSubtotal * itemDto.Discount / 100;
                }
                else
                {
                    itemDiscountAmount = itemDto.Discount;
                }
                var itemTotal = itemSubtotal - itemDiscountAmount;

                var item = new PurchaseOrderItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderId = existing.Id,
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    ReceivedQuantity = 0,
                    UnitId = itemDto.UnitId,
                    UnitPrice = itemDto.UnitPrice,
                    Discount = itemDto.Discount,
                    DiscountType = ParseEnum<DiscountType>(itemDto.DiscountType ?? "Percent", DiscountType.Percent),
                    Total = itemTotal,
                    CreatedAt = now
                };

                existing.Items.Add(item);
                subtotal += itemTotal;
            }

            // Recalculate totals
            existing.Subtotal = subtotal;
            decimal discountAmount = 0;
            if (existing.DiscountType == DiscountType.Percent)
            {
                discountAmount = existing.Subtotal * existing.Discount / 100;
            }
            else
            {
                discountAmount = existing.Discount;
            }
            existing.Total = existing.Subtotal - discountAmount;
        }

        existing.UpdatedAt = now;

        await _unitOfWork.PurchaseOrders.UpdateAsync(existing);
        await _unitOfWork.SaveChangesAsync();

        // Reload order with all relationships
        var updatedOrder = await _context.PurchaseOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Unit)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (updatedOrder == null)
        {
            return null;
        }

        return MapToDto(updatedOrder);
    }

    /**
     * Delete a purchase order
     */
    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.PurchaseOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (existing == null)
        {
            return false;
        }

        // Only allow deleting draft or cancelled orders
        if (existing.Status != PurchaseOrderStatus.Draft && existing.Status != PurchaseOrderStatus.Cancelled)
        {
            throw new InvalidOperationException("Only draft or cancelled purchase orders can be deleted");
        }

        // Delete items first
        foreach (var item in existing.Items.ToList())
        {
            await _unitOfWork.PurchaseOrderItems.DeleteAsync(item);
        }

        // Delete order
        await _unitOfWork.PurchaseOrders.DeleteAsync(existing);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    /**
     * Receive goods from purchase order
     */
    public async Task<PurchaseOrderDto?> ReceiveGoodsAsync(Guid id, ReceiveGoodsDto dto)
    {
        var order = await _context.PurchaseOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Unit)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.BaseUnit)
            .Include(o => o.Items)
                .ThenInclude(i => i.Unit)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return null;
        }

        // Only allow receiving from Ordered or PartialReceived orders
        if (order.Status != PurchaseOrderStatus.Ordered && order.Status != PurchaseOrderStatus.PartialReceived)
        {
            throw new InvalidOperationException("Can only receive goods from Ordered or PartialReceived purchase orders");
        }

        // Verify warehouse exists
        var warehouse = await _unitOfWork.Warehouses.GetByIdAsync(dto.WarehouseId);
        if (warehouse == null)
        {
            throw new ArgumentException($"Warehouse with ID {dto.WarehouseId} not found", nameof(dto.WarehouseId));
        }

        var now = dto.ReceivedDate ?? DateTime.UtcNow;
        var receivedDate = dto.ReceivedDate ?? DateTime.UtcNow;

        // Process each received item
        var itemLookup = order.Items.ToDictionary(i => i.Id, i => i);
        bool allReceived = true;
        bool someReceived = false;

        foreach (var receiveItem in dto.Items)
        {
            if (!itemLookup.TryGetValue(receiveItem.OrderItemId, out var orderItem))
            {
                throw new ArgumentException($"Order item {receiveItem.OrderItemId} not found in order", nameof(receiveItem.OrderItemId));
            }

            if (receiveItem.ReceivedQuantity <= 0)
            {
                continue;
            }

            if (receiveItem.ReceivedQuantity > orderItem.Quantity - orderItem.ReceivedQuantity)
            {
                throw new ArgumentException($"Received quantity {receiveItem.ReceivedQuantity} exceeds remaining quantity for item {orderItem.Id}", nameof(receiveItem.ReceivedQuantity));
            }

            // Update received quantity
            orderItem.ReceivedQuantity += receiveItem.ReceivedQuantity;
            someReceived = true;

            // Check if item is fully received
            if (orderItem.ReceivedQuantity < orderItem.Quantity)
            {
                allReceived = false;
            }

            // Update stock
            await UpdateStockForReceivedItemAsync(orderItem, receiveItem, warehouse.Id, now);
        }

        if (!someReceived)
        {
            throw new ArgumentException("At least one item must have received quantity greater than 0", nameof(dto.Items));
        }

        // Update order status
        if (allReceived)
        {
            order.Status = PurchaseOrderStatus.Received;
            order.ReceivedDate = receivedDate;
        }
        else
        {
            order.Status = PurchaseOrderStatus.PartialReceived;
            if (!order.ReceivedDate.HasValue)
            {
                order.ReceivedDate = receivedDate;
            }
        }

        order.UpdatedAt = now;

        await _unitOfWork.PurchaseOrders.UpdateAsync(order);
        await _unitOfWork.SaveChangesAsync();

        // Reload order with all relationships
        var updatedOrder = await _context.PurchaseOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Unit)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (updatedOrder == null)
        {
            return null;
        }

        return MapToDto(updatedOrder);
    }

    /**
     * Create payment for purchase order
     */
    public async Task<PurchaseOrderDto?> CreatePaymentAsync(Guid id, CreatePurchaseOrderPaymentDto dto)
    {
        var order = await _context.PurchaseOrders
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return null;
        }

        if (dto.Amount <= 0)
        {
            throw new ArgumentException("Payment amount must be greater than 0", nameof(dto.Amount));
        }

        var remainingAmount = order.Total - order.PaidAmount;
        if (dto.Amount > remainingAmount)
        {
            throw new ArgumentException($"Payment amount {dto.Amount} exceeds remaining amount {remainingAmount}", nameof(dto.Amount));
        }

        var now = dto.TransactionDate ?? DateTime.UtcNow;
        var supplier = order.Supplier;

        // Update paid amount
        order.PaidAmount += dto.Amount;
        order.UpdatedAt = now;

        // Create payable transaction if payment method is Credit
        if (order.PaymentMethod == PaymentMethod.Credit && supplier != null)
        {
            var balanceBefore = supplier.Payables;
            var balanceAfter = Math.Max(0, balanceBefore - dto.Amount);

            var payableTransaction = new PayableTransaction
            {
                SupplierId = supplier.Id,
                Type = PayableTransactionType.Payment,
                Amount = dto.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? $"Thanh toán đơn nhập hàng {order.Code}"
                    : dto.Description,
                PaymentMethod = dto.PaymentMethod,
                TransactionDate = now,
                ReferenceType = "PurchaseOrder",
                ReferenceId = order.Id,
                CreatedBy = dto.CreatedBy,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _unitOfWork.PayableTransactions.AddAsync(payableTransaction);

            supplier.Payables = balanceAfter;
            if (supplier.Payables == 0)
            {
                supplier.PaymentDueDate = null;
            }
            supplier.UpdatedAt = now;
            await _unitOfWork.Suppliers.UpdateAsync(supplier);
        }

        // Create cashbook entry for non-credit payments
        if (dto.PaymentMethod != PaymentMethod.Credit)
        {
            var cashbookEntry = new CashbookEntry
            {
                Type = CashbookEntryType.Expense,
                Category = "Nhập hàng",
                Amount = dto.Amount,
                Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? $"Thanh toán đơn nhập hàng {order.Code}"
                    : dto.Description,
                PaymentMethod = dto.PaymentMethod,
                ReferenceType = "PurchaseOrder",
                ReferenceId = order.Id,
                TransactionDate = now,
                CreatedBy = dto.CreatedBy,
                CreatedAt = now
            };

            await _unitOfWork.CashbookEntries.AddAsync(cashbookEntry);
        }

        await _unitOfWork.PurchaseOrders.UpdateAsync(order);
        await _unitOfWork.SaveChangesAsync();

        // Reload order with all relationships
        var updatedOrder = await _context.PurchaseOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Unit)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (updatedOrder == null)
        {
            return null;
        }

        return MapToDto(updatedOrder);
    }

    /**
     * Update stock for received item
     */
    private async Task UpdateStockForReceivedItemAsync(
        PurchaseOrderItem orderItem,
        ReceiveGoodsItemDto receiveItem,
        Guid warehouseId,
        DateTime transactionDate)
    {
        try
        {
            var product = orderItem.Product;
            if (product == null)
            {
                _logger.LogWarning("Product {ProductId} not found for order item {ItemId}", orderItem.ProductId, orderItem.Id);
                return;
            }

            // Calculate quantity in base unit
            decimal quantityToAdd = CalculateQuantityInBaseUnit(
                receiveItem.ReceivedQuantity,
                orderItem.UnitId,
                product.UnitId,
                product.BaseUnitId,
                product.ConversionRate);

            // Get or create stock record
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.ProductId == product.Id && s.WarehouseId == warehouseId);

            if (stock == null)
            {
                stock = new Stock
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    WarehouseId = warehouseId,
                    Quantity = 0,
                    ReservedQuantity = 0,
                    LastUpdatedAt = transactionDate
                };
                await _unitOfWork.Stocks.AddAsync(stock);
            }

            // Add stock quantity
            stock.Quantity += quantityToAdd;
            stock.LastUpdatedAt = transactionDate;
            await _unitOfWork.Stocks.UpdateAsync(stock);

            // Create stock batch if expiry date is provided
            Guid? batchId = null;
            if (receiveItem.ExpiryDate.HasValue)
            {
                var batch = new StockBatch
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    WarehouseId = warehouseId,
                    BatchNumber = $"BATCH-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 8)}",
                    ExpiryDate = receiveItem.ExpiryDate,
                    Quantity = quantityToAdd,
                    RemainingQuantity = quantityToAdd,
                    CostPrice = orderItem.UnitPrice,
                    ReceivedDate = transactionDate,
                    CreatedAt = transactionDate
                };
                await _unitOfWork.StockBatches.AddAsync(batch);
                batchId = batch.Id;
            }

            // Create stock transaction
            var stockTransaction = new StockTransaction
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                WarehouseId = warehouseId,
                BatchId = batchId,
                Type = StockTransactionType.In,
                Quantity = quantityToAdd,
                CostPrice = orderItem.UnitPrice,
                ReferenceType = "PurchaseOrder",
                ReferenceId = orderItem.PurchaseOrderId,
                Notes = $"Nhập kho từ đơn nhập hàng {orderItem.PurchaseOrder?.Code ?? "N/A"}",
                TransactionDate = transactionDate,
                CreatedBy = orderItem.PurchaseOrder?.CreatedBy ?? "System",
                CreatedAt = transactionDate
            };
            await _unitOfWork.StockTransactions.AddAsync(stockTransaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating stock for item {ItemId} in purchase order", orderItem.Id);
            throw;
        }
    }

    /**
     * Calculate quantity in base unit
     */
    private decimal CalculateQuantityInBaseUnit(
        decimal quantity,
        Guid unitId,
        Guid productUnitId,
        Guid? baseUnitId,
        decimal conversionRate)
    {
        // If product has a base unit and the unit is different from base unit
        if (baseUnitId.HasValue)
        {
            // If unit is the product's unit (not base unit), convert using conversion rate
            if (unitId == productUnitId && unitId != baseUnitId.Value)
            {
                return quantity * conversionRate;
            }
            // If unit is already the base unit, no conversion needed
            if (unitId == baseUnitId.Value)
            {
                return quantity;
            }
        }

        // No base unit defined or unit matches product unit, use quantity as-is
        return quantity;
    }

    /**
     * Map PurchaseOrder entity to DTO
     */
    private PurchaseOrderDto MapToDto(PurchaseOrder order)
    {
        var dto = new PurchaseOrderDto
        {
            Id = order.Id,
            Code = order.Code,
            SupplierId = order.SupplierId,
            SupplierName = order.Supplier?.Name,
            Status = order.Status.ToString(),
            Subtotal = order.Subtotal,
            Discount = order.Discount,
            DiscountType = order.DiscountType.ToString(),
            Total = order.Total,
            PaymentMethod = order.PaymentMethod.ToString(),
            PaidAmount = order.PaidAmount,
            ExpectedDeliveryDate = order.ExpectedDeliveryDate,
            ReceivedDate = order.ReceivedDate,
            Notes = order.Notes,
            CreatedBy = order.CreatedBy,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Items = order.Items?.Select(i => new PurchaseOrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
                Quantity = i.Quantity,
                ReceivedQuantity = i.ReceivedQuantity,
                UnitId = i.UnitId,
                UnitName = i.Unit?.Name ?? string.Empty,
                UnitPrice = i.UnitPrice,
                Discount = i.Discount,
                DiscountType = i.DiscountType.ToString(),
                Total = i.Total
            }).ToList() ?? new List<PurchaseOrderItemDto>()
        };

        return dto;
    }

    /**
     * Helper method to parse enum from string with fallback
     */
    private static T ParseEnum<T>(string value, T defaultValue) where T : struct, Enum
    {
        if (Enum.TryParse<T>(value, true, out var result))
        {
            return result;
        }
        return defaultValue;
    }
}

