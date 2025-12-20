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
    public async Task<IActionResult> Create([FromBody] SaleOrder order)
    {
        try
        {
            if (order == null) return BadRequest();

            // Basic total and item linking
            order.CreatedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;
            if (order.Items != null)
            {
                foreach (var item in order.Items)
                {
                    item.SaleOrderId = order.Id;
                }
            }

            await _unitOfWork.SaleOrders.AddAsync(order);

            // Optionally update stock and cashbook / transactions here

            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
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
