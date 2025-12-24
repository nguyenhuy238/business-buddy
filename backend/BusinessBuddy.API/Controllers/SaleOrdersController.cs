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

            // Optionally update stock and cashbook / transactions here

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
            existing.CompletedAt = order.CompletedAt;
            existing.UpdatedAt = DateTime.UtcNow;

            // Update items - remove old items and add new ones
            if (order.Items != null)
            {
                // Remove existing items
                foreach (var item in existing.Items.ToList())
                {
                    await _unitOfWork.SaleOrderItems.DeleteAsync(item);
                }

                // Add new items
                foreach (var item in order.Items)
                {
                    item.SaleOrderId = existing.Id;
                    await _unitOfWork.SaleOrderItems.AddAsync(item);
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
}
