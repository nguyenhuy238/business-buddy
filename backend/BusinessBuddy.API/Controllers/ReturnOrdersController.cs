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
public class ReturnOrdersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ReturnOrdersController> _logger;

    public ReturnOrdersController(
        IUnitOfWork unitOfWork,
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<ReturnOrdersController> logger)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /**
     * Get all return orders with optional filters
     */
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? saleOrderId = null,
        [FromQuery] Guid? customerId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _context.ReturnOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.SaleOrder)
                .Include(o => o.Customer)
                .AsQueryable();

            if (saleOrderId.HasValue)
                query = query.Where(o => o.SaleOrderId == saleOrderId.Value);
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

            var orderDtos = orders.Select(o => _mapper.Map<ReturnOrderDto>(o)).ToList();
            return Ok(new { total, items = orderDtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting return orders");
            return StatusCode(500, $"An error occurred while retrieving return orders: {ex.Message}");
        }
    }

    /**
     * Get return order by ID
     */
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var order = await _context.ReturnOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.SaleOrder)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            var orderDto = _mapper.Map<ReturnOrderDto>(order);
            return Ok(orderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting return order by id");
            return StatusCode(500, "An error occurred while retrieving the return order");
        }
    }

    /**
     * Create a new return order
     * This will:
     * - Restore stock for returned items
     * - Update receivables if payment method was Credit
     * - Create cashbook entry for refund
     */
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReturnOrderDto dto)
    {
        try
        {
            if (dto == null || dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Return order must have at least one item");

            // Load the original sale order
            var saleOrder = await _context.SaleOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == dto.SaleOrderId);

            if (saleOrder == null)
                return NotFound("Sale order not found");

            if (saleOrder.Status != SaleOrderStatus.Completed)
                return BadRequest("Only completed sale orders can be returned");

            var now = DateTime.UtcNow;

            // Create return order
            var returnOrder = new ReturnOrder
            {
                Id = Guid.NewGuid(),
                SaleOrderId = dto.SaleOrderId,
                CustomerId = saleOrder.CustomerId,
                Status = ReturnOrderStatus.Draft,
                RefundMethod = dto.RefundMethod,
                Reason = dto.Reason,
                Notes = dto.Notes,
                CreatedBy = dto.CreatedBy,
                CreatedAt = now,
                UpdatedAt = now
            };

            // Generate return order code
            var codePrefix = $"RO-{now:yyyyMMdd}-{now:HHmmss}";
            var existingCount = await _context.ReturnOrders
                .CountAsync(o => o.Code.StartsWith(codePrefix));
            returnOrder.Code = $"{codePrefix}-{(existingCount + 1):D4}";

            // Build lookup for sale order items
            var saleOrderItemLookup = saleOrder.Items.ToDictionary(i => i.Id, i => i);

            decimal subtotal = 0;

            // Create return order items
            foreach (var itemDto in dto.Items)
            {
                if (!saleOrderItemLookup.TryGetValue(itemDto.SaleOrderItemId, out var saleOrderItem))
                {
                    return BadRequest($"Sale order item {itemDto.SaleOrderItemId} not found");
                }

                if (itemDto.Quantity <= 0)
                {
                    return BadRequest("Return quantity must be greater than zero");
                }

                if (itemDto.Quantity > saleOrderItem.Quantity)
                {
                    return BadRequest("Return quantity cannot exceed sold quantity");
                }

                // Calculate proportional refund based on line total
                var unitTotal = saleOrderItem.Total / saleOrderItem.Quantity;
                var itemTotal = unitTotal * itemDto.Quantity;
                subtotal += itemTotal;

                var returnOrderItem = new ReturnOrderItem
                {
                    Id = Guid.NewGuid(),
                    ReturnOrderId = returnOrder.Id,
                    SaleOrderItemId = itemDto.SaleOrderItemId,
                    ProductId = saleOrderItem.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitId = saleOrderItem.UnitId,
                    UnitPrice = saleOrderItem.UnitPrice,
                    Total = itemTotal,
                    Notes = itemDto.Notes,
                    CreatedAt = now
                };

                returnOrder.Items.Add(returnOrderItem);
            }

            returnOrder.Subtotal = subtotal;
            returnOrder.Total = subtotal;
            returnOrder.RefundAmount = subtotal;

            await _unitOfWork.ReturnOrders.AddAsync(returnOrder);

            // Restore stock for returned items
            await RestoreStockForReturnOrderAsync(returnOrder, saleOrder, now);

            // Update receivables if payment method was Credit
            if (dto.UpdateReceivables && saleOrder.PaymentMethod == PaymentMethod.Credit && saleOrder.CustomerId.HasValue)
            {
                var customer = await _unitOfWork.Customers.GetByIdAsync(saleOrder.CustomerId.Value);
                if (customer != null)
                {
                    var balanceBefore = customer.Receivables;
                    var balanceAfter = balanceBefore - returnOrder.RefundAmount;
                    if (balanceAfter < 0)
                    {
                        balanceAfter = 0;
                    }

                    var receivableTransaction = new ReceivableTransaction
                    {
                        CustomerId = customer.Id,
                        Type = ReceivableTransactionType.Refund,
                        Amount = returnOrder.RefundAmount,
                        BalanceBefore = balanceBefore,
                        BalanceAfter = balanceAfter,
                        Description = string.IsNullOrWhiteSpace(returnOrder.Reason)
                            ? $"Hoàn tiền đơn hàng {saleOrder.Code} - Đơn trả hàng {returnOrder.Code}"
                            : $"Hoàn tiền đơn hàng {saleOrder.Code}: {returnOrder.Reason}",
                        PaymentMethod = dto.RefundMethod,
                        DueDate = null,
                        TransactionDate = now,
                        ReferenceType = "ReturnOrder",
                        ReferenceId = returnOrder.Id,
                        CreatedBy = dto.CreatedBy,
                        CreatedAt = now,
                        UpdatedAt = now
                    };

                    await _unitOfWork.ReceivableTransactions.AddAsync(receivableTransaction);

                    customer.Receivables = balanceAfter;
                    if (customer.Receivables == 0)
                    {
                        customer.PaymentDueDate = null;
                    }

                    customer.UpdatedAt = now;
                    await _unitOfWork.Customers.UpdateAsync(customer);
                }
            }

            // Create cashbook entry for refund
            if (dto.CreateCashbookEntry && saleOrder.PaymentMethod != PaymentMethod.Credit)
            {
                var cashbookEntry = new CashbookEntry
                {
                    Type = CashbookEntryType.Expense,
                    Category = "Hoàn tiền đơn hàng",
                    Amount = returnOrder.RefundAmount,
                    Description = string.IsNullOrWhiteSpace(returnOrder.Reason)
                        ? $"Hoàn tiền cho đơn hàng {saleOrder.Code} - Đơn trả hàng {returnOrder.Code}"
                        : $"Hoàn tiền cho đơn hàng {saleOrder.Code}: {returnOrder.Reason}",
                    PaymentMethod = dto.RefundMethod,
                    ReferenceType = "ReturnOrder",
                    ReferenceId = returnOrder.Id,
                    TransactionDate = now,
                    CreatedBy = dto.CreatedBy,
                    CreatedAt = now
                };

                await _unitOfWork.CashbookEntries.AddAsync(cashbookEntry);
            }

            // Complete the return order
            returnOrder.Status = ReturnOrderStatus.Completed;
            returnOrder.CompletedAt = now;

            await _unitOfWork.SaveChangesAsync();

            // Load the created order with all relationships
            var createdOrder = await _context.ReturnOrders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Unit)
                .Include(o => o.SaleOrder)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == returnOrder.Id);

            if (createdOrder == null)
                return StatusCode(500, "Failed to retrieve created return order");

            var orderDto = _mapper.Map<ReturnOrderDto>(createdOrder);
            return CreatedAtAction(nameof(GetById), new { id = returnOrder.Id }, orderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating return order");
            return StatusCode(500, "An error occurred while creating the return order");
        }
    }

    /**
     * Restores stock for items in a return order
     */
    private async Task RestoreStockForReturnOrderAsync(
        ReturnOrder returnOrder,
        SaleOrder saleOrder,
        DateTime transactionDate)
    {
        var defaultWarehouse = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.IsDefault && w.IsActive);

        if (defaultWarehouse == null)
        {
            _logger.LogWarning("No default warehouse found. Stock restoration skipped for return order {ReturnOrderId}", returnOrder.Id);
            return;
        }

        var saleOrderItemLookup = saleOrder.Items.ToDictionary(i => i.Id, i => i);

        foreach (var returnItem in returnOrder.Items)
        {
            try
            {
                if (!saleOrderItemLookup.TryGetValue(returnItem.SaleOrderItemId, out var saleOrderItem))
                {
                    continue;
                }

                var product = saleOrderItem.Product;
                if (product == null)
                {
                    _logger.LogWarning("Product {ProductId} not found for return item {ItemId}", returnItem.ProductId, returnItem.Id);
                    continue;
                }

                // Calculate quantity in base unit
                var quantityToRestore = CalculateQuantityInBaseUnit(
                    returnItem.Quantity,
                    returnItem.UnitId,
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
                    CostPrice = saleOrderItem.CostPrice,
                    ReferenceType = "ReturnOrder",
                    ReferenceId = returnOrder.Id,
                    Notes = $"Hoàn trả hàng từ đơn hàng {saleOrder.Code} - Đơn trả hàng {returnOrder.Code}",
                    TransactionDate = transactionDate,
                    CreatedBy = returnOrder.CreatedBy,
                    CreatedAt = transactionDate
                };
                await _unitOfWork.StockTransactions.AddAsync(stockTransaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring stock for item {ItemId} in return order {ReturnOrderId}", returnItem.Id, returnOrder.Id);
            }
        }
    }

    /**
     * Calculates the quantity in base unit for stock restoration
     */
    private decimal CalculateQuantityInBaseUnit(
        decimal quantity,
        Guid saleUnitId,
        Guid productUnitId,
        Guid? baseUnitId,
        decimal conversionRate)
    {
        if (baseUnitId.HasValue)
        {
            if (saleUnitId == productUnitId && saleUnitId != baseUnitId.Value)
            {
                return quantity * conversionRate;
            }
            if (saleUnitId == baseUnitId.Value)
            {
                return quantity;
            }
            return quantity;
        }

        return quantity;
    }

    /**
     * Delete a return order (only if status is Draft)
     */
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _context.ReturnOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (existing == null)
                return NotFound();

            if (existing.Status != ReturnOrderStatus.Draft)
            {
                return BadRequest("Only draft return orders can be deleted");
            }

            // Delete items first
            foreach (var item in existing.Items.ToList())
            {
                await _unitOfWork.ReturnOrderItems.DeleteAsync(item);
            }

            // Delete return order
            await _unitOfWork.ReturnOrders.DeleteAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting return order {ReturnOrderId}", id);
            return StatusCode(500, "An error occurred while deleting the return order");
        }
    }
}

