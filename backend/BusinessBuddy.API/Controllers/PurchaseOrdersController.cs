using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _purchaseOrderService;
    private readonly ILogger<PurchaseOrdersController> _logger;

    public PurchaseOrdersController(
        IPurchaseOrderService purchaseOrderService,
        ILogger<PurchaseOrdersController> logger)
    {
        _purchaseOrderService = purchaseOrderService;
        _logger = logger;
    }

    /**
     * Get all purchase orders with optional filters
     */
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? supplierId = null,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var (total, items) = await _purchaseOrderService.GetAllAsync(
                supplierId,
                status,
                from,
                to,
                page,
                pageSize);

            return Ok(new { total, items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting purchase orders");
            return StatusCode(500, $"An error occurred while retrieving purchase orders: {ex.Message}");
        }
    }

    /**
     * Get a purchase order by ID
     */
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var order = await _purchaseOrderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            return Ok(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting purchase order by id");
            return StatusCode(500, "An error occurred while retrieving the purchase order");
        }
    }

    /**
     * Create a new purchase order
     */
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest("Purchase order data is required");
            }

            var order = await _purchaseOrderService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument when creating purchase order");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating purchase order");
            return StatusCode(500, "An error occurred while creating the purchase order");
        }
    }

    /**
     * Update an existing purchase order
     */
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseOrderDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest("Purchase order data is required");
            }

            var order = await _purchaseOrderService.UpdateAsync(id, dto);
            if (order == null)
            {
                return NotFound();
            }

            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when updating purchase order");
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument when updating purchase order");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating purchase order {OrderId}", id);
            return StatusCode(500, "An error occurred while updating the purchase order");
        }
    }

    /**
     * Delete a purchase order
     */
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _purchaseOrderService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when deleting purchase order");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting purchase order {OrderId}", id);
            return StatusCode(500, "An error occurred while deleting the purchase order");
        }
    }

    /**
     * Receive goods from purchase order
     */
    [HttpPost("{id}/receive")]
    public async Task<IActionResult> ReceiveGoods(Guid id, [FromBody] ReceiveGoodsDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest("Receive goods data is required");
            }

            var order = await _purchaseOrderService.ReceiveGoodsAsync(id, dto);
            if (order == null)
            {
                return NotFound();
            }

            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when receiving goods");
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument when receiving goods");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error receiving goods for purchase order {OrderId}", id);
            return StatusCode(500, "An error occurred while receiving goods");
        }
    }

    /**
     * Create payment for purchase order
     */
    [HttpPost("{id}/payment")]
    public async Task<IActionResult> CreatePayment(Guid id, [FromBody] CreatePurchaseOrderPaymentDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest("Payment data is required");
            }

            var order = await _purchaseOrderService.CreatePaymentAsync(id, dto);
            if (order == null)
            {
                return NotFound();
            }

            return Ok(order);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument when creating payment");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment for purchase order {OrderId}", id);
            return StatusCode(500, "An error occurred while creating payment");
        }
    }
}

