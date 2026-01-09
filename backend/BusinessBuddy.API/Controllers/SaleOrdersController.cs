using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Application.Mapping;
using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using BusinessBuddy.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SaleOrdersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SaleOrdersController> _logger;

    public SaleOrdersController(IUnitOfWork unitOfWork, ApplicationDbContext context, IMapper mapper, ILogger<SaleOrdersController> logger)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Create a partial refund for a completed sale order.
    /// This will:
    /// - Restore stock for the returned quantities
    /// - Optionally create a receivable transaction for credit sales
    /// - Optionally create a cashbook expense entry for cash/bank refunds
    /// </summary>
    [HttpPost("{id:guid}/refund")]
    public async Task<IActionResult> CreatePartialRefund(Guid id, [FromBody] CreateSaleOrderRefundDto dto)
    {
        if (dto == null || dto.Items == null || dto.Items.Count == 0)
        {
            return BadRequest("Refund must contain at least one item");
        }

        if (dto.OrderId != Guid.Empty && dto.OrderId != id)
        {
            return BadRequest("Order id mismatch");
        }

        try
        {
            var order = await _context.SaleOrders
                .Include(o => o.Items)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound("Sale order not found");
            }

            if (order.Status != SaleOrderStatus.Completed)
            {
                return BadRequest("Only completed orders can be partially refunded");
            }

            var now = dto.TransactionDate == default ? DateTime.UtcNow : dto.TransactionDate;

            // Build a lookup for existing items
            var itemLookup = order.Items.ToDictionary(i => i.Id, i => i);

            decimal totalRefundAmount = 0;

            foreach (var refundItem in dto.Items)
            {
                if (!itemLookup.TryGetValue(refundItem.OrderItemId, out var orderItem))
                {
                    return BadRequest($"Order item {refundItem.OrderItemId} not found in order");
                }

                if (refundItem.Quantity <= 0)
                {
                    return BadRequest("Refund quantity must be greater than zero");
                }

                if (refundItem.Quantity > orderItem.Quantity)
                {
                    return BadRequest("Refund quantity cannot exceed sold quantity");
                }

                // Proportional refund based on line total
                var unitTotal = orderItem.Total / orderItem.Quantity;
                totalRefundAmount += unitTotal * refundItem.Quantity;
            }

            if (totalRefundAmount <= 0)
            {
                return BadRequest("Calculated refund amount must be greater than zero");
            }

            // Restore stock for refunded quantities
            await RestoreStockForPartialRefundAsync(order, dto.Items, now);

            // Update receivables for credit sales if requested
            if (dto.UpdateReceivables && order.PaymentMethod == PaymentMethod.Credit && order.CustomerId.HasValue)
            {
                var customer = await _unitOfWork.Customers.GetByIdAsync(order.CustomerId.Value);
                if (customer != null)
                {
                    var balanceBefore = customer.Receivables;
                    var balanceAfter = balanceBefore - totalRefundAmount;
                    if (balanceAfter < 0)
                    {
                        balanceAfter = 0;
                    }

                    var receivableTransaction = new ReceivableTransaction
                    {
                        CustomerId = customer.Id,
                        Type = ReceivableTransactionType.Refund,
                        Amount = totalRefundAmount,
                        BalanceBefore = balanceBefore,
                        BalanceAfter = balanceAfter,
                        Description = string.IsNullOrWhiteSpace(dto.Description)
                            ? $"Hoàn tiền một phần đơn hàng {order.Code}"
                            : dto.Description,
                        PaymentMethod = dto.PaymentMethod,
                        DueDate = null,
                        TransactionDate = now,
                        ReferenceType = "SaleOrder",
                        ReferenceId = order.Id,
                        CreatedBy = dto.CreatedBy,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _unitOfWork.ReceivableTransactions.AddAsync(receivableTransaction);

                    customer.Receivables = balanceAfter;
                    if (customer.Receivables == 0)
                    {
                        customer.PaymentDueDate = null;
                    }

                    customer.UpdatedAt = DateTime.UtcNow;
                    await _unitOfWork.Customers.UpdateAsync(customer);
                }
            }

            // Create cashbook entry for cash/bank refunds if requested
            if (dto.CreateCashbookEntry && order.PaymentMethod != BusinessBuddy.Domain.Entities.PaymentMethod.Credit)
            {
                var cashbookEntry = new CashbookEntry
                {
                    Type = CashbookEntryType.Expense,
                    Category = "Hoàn tiền đơn hàng",
                    Amount = totalRefundAmount,
                    Description = string.IsNullOrWhiteSpace(dto.Description)
                        ? $"Hoàn tiền một phần cho đơn hàng {order.Code}"
                        : dto.Description,
                    PaymentMethod = dto.PaymentMethod,
                    ReferenceType = "SaleOrder",
                    ReferenceId = order.Id,
                    TransactionDate = now,
                    CreatedBy = dto.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.CashbookEntries.AddAsync(cashbookEntry);
            }

            await _unitOfWork.SaveChangesAsync();

            return Ok(new
            {
                message = "Partial refund processed successfully",
                refundAmount = totalRefundAmount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating partial refund for sale order {OrderId}", id);
            return StatusCode(500, "An error occurred while processing the partial refund");
        }
    }

    /// <summary>
    /// Restores stock for a partial refund (specified quantities per order item)
    /// </summary>
    private async Task RestoreStockForPartialRefundAsync(
        SaleOrder order,
        IEnumerable<SaleOrderRefundItemDto> refundItems,
        DateTime transactionDate)
    {
        var defaultWarehouse = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.IsDefault && w.IsActive);

        if (defaultWarehouse == null)
        {
            _logger.LogWarning("No default warehouse found. Stock restoration skipped for partial refund of order {OrderId}", order.Id);
            return;
        }

        var refundLookup = refundItems.ToDictionary(i => i.OrderItemId, i => i);

        var items = await _context.SaleOrderItems
            .Include(i => i.Product)
                .ThenInclude(p => p.Unit)
            .Include(i => i.Product)
                .ThenInclude(p => p.BaseUnit)
            .Where(i => i.SaleOrderId == order.Id && refundLookup.ContainsKey(i.Id))
            .ToListAsync();

        foreach (var item in items)
        {
            try
            {
                if (!refundLookup.TryGetValue(item.Id, out var refundItem))
                {
                    continue;
                }

                var product = item.Product;
                if (product == null)
                {
                    _logger.LogWarning("Product {ProductId} not found for order item {ItemId} in partial refund", item.ProductId, item.Id);
                    continue;
                }

                var quantityToRestore = CalculateQuantityInBaseUnit(
                    refundItem.Quantity,
                    item.UnitId,
                    product.UnitId,
                    product.BaseUnitId,
                    product.ConversionRate);

                var stock = await _context.Stocks
                    .FirstOrDefaultAsync(s => s.ProductId == product.Id && s.WarehouseId == defaultWarehouse.Id);

                if (stock == null)
                {
                    stock = new Stock
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        WarehouseId = defaultWarehouse.Id,
                        Quantity = 0,
                        ReservedQuantity = 0,
                        LastUpdatedAt = transactionDate
                    };
                    await _unitOfWork.Stocks.AddAsync(stock);
                }

                stock.Quantity += quantityToRestore;
                stock.LastUpdatedAt = transactionDate;
                await _unitOfWork.Stocks.UpdateAsync(stock);

                var stockTransaction = new StockTransaction
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    WarehouseId = defaultWarehouse.Id,
                    Type = StockTransactionType.In,
                    Quantity = quantityToRestore,
                    CostPrice = item.CostPrice,
                    ReferenceType = "SaleOrder",
                    ReferenceId = order.Id,
                    Notes = $"Hoàn trả hàng (một phần) từ đơn hàng {order.Code}",
                    TransactionDate = transactionDate,
                    CreatedBy = order.CreatedBy,
                    CreatedAt = transactionDate
                };
                await _unitOfWork.StockTransactions.AddAsync(stockTransaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring stock for item {ItemId} in partial refund of order {OrderId}", item.Id, order.Id);
            }
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? customerId = null, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _context.SaleOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.Customer)
                .AsQueryable();

            if (customerId.HasValue)
                query = query.Where(o => o.CustomerId == customerId.Value);
            if (from.HasValue)
                query = query.Where(o => o.CreatedAt >= from.Value);
            if (to.HasValue)
                query = query.Where(o => o.CreatedAt <= to.Value);

            var total = await query.CountAsync();
            var orders = await query.OrderByDescending(o => o.CreatedAt)
                                   .Skip((page - 1) * pageSize)
                                   .Take(pageSize)
                                   .ToListAsync();

            // Map to DTOs to avoid circular references
            var orderDtos = new List<SaleOrderDto>();
            foreach (var order in orders)
            {
                try
                {
                    var dto = _mapper.Map<SaleOrderDto>(order);
                    orderDtos.Add(dto);
                }
                catch (Exception mapEx)
                {
                    _logger.LogWarning(mapEx, "Error mapping order {OrderId}, skipping", order.Id);
                    // Continue with next order
                }
            }

            return Ok(new { total, items = orderDtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sale orders: {Message}", ex.Message);
            _logger.LogError(ex, "Stack trace: {StackTrace}", ex.StackTrace);
            return StatusCode(500, $"An error occurred while retrieving sale orders: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var order = await _context.SaleOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);
            
            if (order == null) return NotFound();
            
            // Map to DTO to avoid circular references
            var orderDto = _mapper.Map<SaleOrderDto>(order);
            return Ok(orderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sale order by id");
            return StatusCode(500, "An error occurred while retrieving the sale order");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSaleOrderDto dto)
    {
        try
        {
            if (dto == null || dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Order must have at least one item");

            // Map DTO to entity
            var order = _mapper.Map<SaleOrder>(dto);

            // Generate order code (format: SO-YYYYMMDD-HHMMSS-XXXX)
            var now = DateTime.UtcNow;
            var codePrefix = $"SO-{now:yyyyMMdd}-{now:HHmmss}";
            var existingCount = await _context.SaleOrders
                .CountAsync(o => o.Code.StartsWith(codePrefix));
            order.Code = $"{codePrefix}-{(existingCount + 1):D4}";

            // Calculate subtotal from items
            order.Subtotal = order.Items.Sum(i => i.Total);

            // Calculate total with discount
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

            // Set timestamps
            order.CreatedAt = now;
            order.UpdatedAt = now;
            if (order.Status == SaleOrderStatus.Completed)
            {
                order.CompletedAt = now;
            }

            // Link items to order
            foreach (var item in order.Items)
            {
                item.SaleOrderId = order.Id;
                item.CreatedAt = now;
            }

            await _unitOfWork.SaleOrders.AddAsync(order);

            // Update stock when order is completed
            if (order.Status == SaleOrderStatus.Completed)
            {
                await UpdateStockForSaleOrderAsync(order, now);
            }

            // Create receivable transaction if payment method is Credit
            if (order.PaymentMethod == PaymentMethod.Credit && order.CustomerId.HasValue && order.Status == SaleOrderStatus.Completed)
            {
                var customer = await _unitOfWork.Customers.GetByIdAsync(order.CustomerId.Value);
                if (customer != null)
                {
                    // Calculate debt amount (total - paidAmount)
                    var debtAmount = order.Total - order.PaidAmount;
                    
                    if (debtAmount > 0)
                    {
                        var balanceBefore = customer.Receivables;
                        var balanceAfter = balanceBefore + debtAmount;

                        // Create receivable transaction
                        var receivableTransaction = new ReceivableTransaction
                        {
                            CustomerId = customer.Id,
                            Type = ReceivableTransactionType.Invoice,
                            Amount = debtAmount,
                            BalanceBefore = balanceBefore,
                            BalanceAfter = balanceAfter,
                            Description = string.IsNullOrWhiteSpace(order.Notes)
                                ? $"Đơn hàng nợ {order.Code}"
                                : $"Đơn hàng nợ {order.Code}: {order.Notes}",
                            PaymentMethod = PaymentMethod.Credit,
                            DueDate = dto.PaymentDueDate,
                            TransactionDate = now,
                            ReferenceType = "SaleOrder",
                            ReferenceId = order.Id,
                            CreatedBy = dto.CreatedBy,
                            CreatedAt = now,
                            UpdatedAt = now
                        };

                        await _unitOfWork.ReceivableTransactions.AddAsync(receivableTransaction);

                        // Update customer receivables
                        customer.Receivables = balanceAfter;
                        if (dto.PaymentDueDate.HasValue)
                        {
                            // Set payment due date to the latest due date if customer already has one
                            if (!customer.PaymentDueDate.HasValue || customer.PaymentDueDate.Value < dto.PaymentDueDate.Value)
                            {
                                customer.PaymentDueDate = dto.PaymentDueDate.Value;
                            }
                        }
                        customer.UpdatedAt = now;
                        await _unitOfWork.Customers.UpdateAsync(customer);
                    }
                }
            }

            // Create cashbook entry for non-credit payments when order is completed
            if (order.PaymentMethod != PaymentMethod.Credit && order.Status == SaleOrderStatus.Completed && order.PaidAmount > 0)
            {
                var cashbookEntry = new CashbookEntry
                {
                    Type = CashbookEntryType.Income,
                    Category = "Bán hàng",
                    Amount = order.PaidAmount,
                    Description = string.IsNullOrWhiteSpace(order.Notes)
                        ? $"Bán hàng - Đơn {order.Code}"
                        : $"Bán hàng - Đơn {order.Code}: {order.Notes}",
                    PaymentMethod = order.PaymentMethod,
                    ReferenceType = "SaleOrder",
                    ReferenceId = order.Id,
                    TransactionDate = now,
                    CreatedBy = dto.CreatedBy,
                    CreatedAt = now
                };

                await _unitOfWork.CashbookEntries.AddAsync(cashbookEntry);
            }

            await _unitOfWork.SaveChangesAsync();

            // Load the order with all relationships for response
            var createdOrder = await _context.SaleOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == order.Id);

            if (createdOrder == null)
                return StatusCode(500, "Failed to retrieve created order");

            var orderDto = _mapper.Map<SaleOrderDto>(createdOrder);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, orderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating sale order");
            return StatusCode(500, "An error occurred while creating the sale order");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaleOrder order)
    {
        try
        {
            if (order == null || id != order.Id) return BadRequest();

            var existing = await _context.SaleOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);
            
            if (existing == null) return NotFound();

            // Track status change for stock management
            var previousStatus = existing.Status;
            var newStatus = order.Status;
            var statusChanged = previousStatus != newStatus;
            var now = DateTime.UtcNow;

            // Update basic fields
            existing.CustomerId = order.CustomerId;
            existing.Status = order.Status;
            existing.Subtotal = order.Subtotal;
            existing.Discount = order.Discount;
            existing.DiscountType = order.DiscountType;
            existing.Total = order.Total;
            existing.PaymentMethod = order.PaymentMethod;
            existing.PaidAmount = order.PaidAmount;
            existing.Notes = order.Notes;
            existing.UpdatedAt = now;

            // Handle status change
            if (statusChanged)
            {
                if (newStatus == SaleOrderStatus.Completed)
                {
                    existing.CompletedAt = now;
                    // Deduct stock if order is being completed
                    if (previousStatus != SaleOrderStatus.Completed)
                    {
                        await UpdateStockForSaleOrderAsync(existing, now);
                    }
                }
                else if ((previousStatus == SaleOrderStatus.Completed) && 
                         (newStatus == SaleOrderStatus.Cancelled || newStatus == SaleOrderStatus.Refunded))
                {
                    // Restore stock if order is being cancelled or refunded
                    await RestoreStockForSaleOrderAsync(existing, now);
                }
            }

            // Update items - remove old items and add new ones
            if (order.Items != null)
            {
                // If status is Completed and items are being changed, restore stock for old items first
                if (existing.Status == SaleOrderStatus.Completed && previousStatus == SaleOrderStatus.Completed)
                {
                    // Restore stock for existing items before they are deleted
                    await RestoreStockForSaleOrderAsync(existing, now);
                }

                // Remove existing items
                foreach (var item in existing.Items.ToList())
                {
                    await _unitOfWork.SaleOrderItems.DeleteAsync(item);
                }

                // Clear the items collection to prepare for new items
                existing.Items.Clear();

                // Add new items
                foreach (var item in order.Items)
                {
                    item.SaleOrderId = existing.Id;
                    item.CreatedAt = now;
                    existing.Items.Add(item);
                }

                // If status is Completed, deduct stock for new items
                if (existing.Status == SaleOrderStatus.Completed)
                {
                    // Update stock using the new items from order parameter
                    // Create a temporary order object with new items for stock deduction
                    var tempOrderForStock = new SaleOrder
                    {
                        Id = existing.Id,
                        Code = existing.Code,
                        CreatedBy = existing.CreatedBy,
                        Items = order.Items.Select(i => new SaleOrderItem
                        {
                            ProductId = i.ProductId,
                            UnitId = i.UnitId,
                            Quantity = i.Quantity,
                            CostPrice = i.CostPrice
                        }).ToList()
                    };
                    await UpdateStockForSaleOrderAsync(tempOrderForStock, now);
                }
            }

            await _unitOfWork.SaleOrders.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            // Return updated order with all relationships
            var updatedOrder = await _context.SaleOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);
            
            var orderDto = _mapper.Map<SaleOrderDto>(updatedOrder);
            return Ok(orderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating sale order {OrderId}", id);
            return StatusCode(500, "An error occurred while updating the sale order");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _context.SaleOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);
            
            if (existing == null) return NotFound();

            // If order was completed, restore stock before deleting
            if (existing.Status == SaleOrderStatus.Completed)
            {
                await RestoreStockForSaleOrderAsync(existing, DateTime.UtcNow);
            }

            // Delete items first
            foreach (var item in existing.Items.ToList())
            {
                await _unitOfWork.SaleOrderItems.DeleteAsync(item);
            }

            // Delete order
            await _unitOfWork.SaleOrders.DeleteAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting sale order {OrderId}", id);
            return StatusCode(500, "An error occurred while deleting the sale order");
        }
    }

    /// <summary>
    /// Updates stock quantities for all items in a completed sale order
    /// </summary>
    /// <param name="order">The sale order to process</param>
    /// <param name="transactionDate">The date/time of the transaction</param>
    private async Task UpdateStockForSaleOrderAsync(SaleOrder order, DateTime transactionDate)
    {
        // Get default warehouse
        var defaultWarehouse = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.IsDefault && w.IsActive);

        if (defaultWarehouse == null)
        {
            _logger.LogWarning("No default warehouse found. Stock update skipped for order {OrderId}", order.Id);
            return;
        }

        // Process each item in the order
        foreach (var item in order.Items)
        {
            try
            {
                // Load product with unit information
                var product = await _context.Products
                    .Include(p => p.Unit)
                    .Include(p => p.BaseUnit)
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                if (product == null)
                {
                    _logger.LogWarning("Product {ProductId} not found for order item {ItemId}", item.ProductId, item.Id);
                    continue;
                }

                // Calculate quantity in base unit
                decimal quantityToDeduct = CalculateQuantityInBaseUnit(
                    item.Quantity,
                    item.UnitId,
                    product.UnitId,
                    product.BaseUnitId,
                    product.ConversionRate);

                // Get or create stock record
                var stock = await _context.Stocks
                    .FirstOrDefaultAsync(s => s.ProductId == product.Id && s.WarehouseId == defaultWarehouse.Id);

                if (stock == null)
                {
                    // Create new stock record if it doesn't exist
                    stock = new Stock
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        WarehouseId = defaultWarehouse.Id,
                        Quantity = 0,
                        ReservedQuantity = 0,
                        LastUpdatedAt = transactionDate
                    };
                    await _unitOfWork.Stocks.AddAsync(stock);
                }

                // Check if there's enough stock
                if (stock.Quantity < quantityToDeduct)
                {
                    _logger.LogWarning(
                        "Insufficient stock for product {ProductId}. Available: {Available}, Required: {Required}",
                        product.Id, stock.Quantity, quantityToDeduct);
                    // Continue processing but log the warning
                    // In production, you might want to throw an exception or return an error
                }

                // Deduct stock quantity
                stock.Quantity -= quantityToDeduct;
                if (stock.Quantity < 0)
                {
                    stock.Quantity = 0; // Prevent negative stock
                }
                stock.LastUpdatedAt = transactionDate;
                await _unitOfWork.Stocks.UpdateAsync(stock);

                // Create stock transaction record
                var stockTransaction = new StockTransaction
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    WarehouseId = defaultWarehouse.Id,
                    Type = StockTransactionType.Out,
                    Quantity = quantityToDeduct,
                    CostPrice = item.CostPrice,
                    ReferenceType = "SaleOrder",
                    ReferenceId = order.Id,
                    Notes = $"Xuất kho từ đơn hàng {order.Code}",
                    TransactionDate = transactionDate,
                    CreatedBy = order.CreatedBy,
                    CreatedAt = transactionDate
                };
                await _unitOfWork.StockTransactions.AddAsync(stockTransaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stock for item {ItemId} in order {OrderId}", item.Id, order.Id);
                // Continue with next item
            }
        }
    }

    /// <summary>
    /// Calculates the quantity in base unit for stock deduction
    /// </summary>
    /// <param name="quantity">The quantity in the sale unit</param>
    /// <param name="saleUnitId">The unit ID used in the sale</param>
    /// <param name="productUnitId">The product's default unit ID</param>
    /// <param name="baseUnitId">The product's base unit ID (optional)</param>
    /// <param name="conversionRate">The conversion rate from product unit to base unit</param>
    /// <returns>Quantity in base unit</returns>
    private decimal CalculateQuantityInBaseUnit(
        decimal quantity,
        Guid saleUnitId,
        Guid productUnitId,
        Guid? baseUnitId,
        decimal conversionRate)
    {
        // If product has a base unit and the sale unit is different from base unit
        if (baseUnitId.HasValue)
        {
            // If sale unit is the product's unit (not base unit), convert using conversion rate
            if (saleUnitId == productUnitId && saleUnitId != baseUnitId.Value)
            {
                return quantity * conversionRate;
            }
            // If sale unit is already the base unit, no conversion needed
            if (saleUnitId == baseUnitId.Value)
            {
                return quantity;
            }
            // If sale unit is different from both product unit and base unit,
            // try to find a conversion in ProductUnitConversion table
            // For now, assume 1:1 if no direct match (this could be enhanced)
            return quantity;
        }

        // No base unit defined, use quantity as-is
        return quantity;
    }

    /// <summary>
    /// Restores stock quantities for all items in a cancelled or refunded sale order
    /// </summary>
    /// <param name="order">The sale order to process</param>
    /// <param name="transactionDate">The date/time of the transaction</param>
    private async Task RestoreStockForSaleOrderAsync(SaleOrder order, DateTime transactionDate)
    {
        // Get default warehouse
        var defaultWarehouse = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.IsDefault && w.IsActive);

        if (defaultWarehouse == null)
        {
            _logger.LogWarning("No default warehouse found. Stock restoration skipped for order {OrderId}", order.Id);
            return;
        }

        // Load order items with product information
        var items = await _context.SaleOrderItems
            .Include(i => i.Product)
                .ThenInclude(p => p.Unit)
            .Include(i => i.Product)
                .ThenInclude(p => p.BaseUnit)
            .Where(i => i.SaleOrderId == order.Id)
            .ToListAsync();

        // Process each item in the order
        foreach (var item in items)
        {
            try
            {
                var product = item.Product;
                if (product == null)
                {
                    _logger.LogWarning("Product {ProductId} not found for order item {ItemId}", item.ProductId, item.Id);
                    continue;
                }

                // Calculate quantity in base unit
                decimal quantityToRestore = CalculateQuantityInBaseUnit(
                    item.Quantity,
                    item.UnitId,
                    product.UnitId,
                    product.BaseUnitId,
                    product.ConversionRate);

                // Get or create stock record
                var stock = await _context.Stocks
                    .FirstOrDefaultAsync(s => s.ProductId == product.Id && s.WarehouseId == defaultWarehouse.Id);

                if (stock == null)
                {
                    // Create new stock record if it doesn't exist
                    stock = new Stock
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        WarehouseId = defaultWarehouse.Id,
                        Quantity = 0,
                        ReservedQuantity = 0,
                        LastUpdatedAt = transactionDate
                    };
                    await _unitOfWork.Stocks.AddAsync(stock);
                }

                // Restore stock quantity
                stock.Quantity += quantityToRestore;
                stock.LastUpdatedAt = transactionDate;
                await _unitOfWork.Stocks.UpdateAsync(stock);

                // Create stock transaction record for restoration
                var stockTransaction = new StockTransaction
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    WarehouseId = defaultWarehouse.Id,
                    Type = StockTransactionType.In,
                    Quantity = quantityToRestore,
                    CostPrice = item.CostPrice,
                    ReferenceType = "SaleOrder",
                    ReferenceId = order.Id,
                    Notes = $"Hoàn trả hàng từ đơn hàng {order.Code}",
                    TransactionDate = transactionDate,
                    CreatedBy = order.CreatedBy,
                    CreatedAt = transactionDate
                };
                await _unitOfWork.StockTransactions.AddAsync(stockTransaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring stock for item {ItemId} in order {OrderId}", item.Id, order.Id);
                // Continue with next item
            }
        }
    }
}
