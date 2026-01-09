using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

/**
 * Cashbook Controller
 * Handles cashbook entry operations (Income/Expense tracking)
 */
[ApiController]
[Route("api/[controller]")]
public class CashbookController : ControllerBase
{
    private readonly ICashbookService _cashbookService;
    private readonly ILogger<CashbookController> _logger;

    public CashbookController(ICashbookService cashbookService, ILogger<CashbookController> logger)
    {
        _cashbookService = cashbookService;
        _logger = logger;
    }

    /**
     * Get all cashbook entries with optional date filters
     * @param from - Optional start date filter
     * @param to - Optional end date filter
     */
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        try
        {
            var entries = await _cashbookService.GetAllEntriesAsync(from, to);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cashbook entries");
            return StatusCode(500, new { message = "An error occurred while retrieving cashbook entries", error = ex.Message });
        }
    }

    /**
     * Get a cashbook entry by ID
     * @param id - Entry ID
     */
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var entry = await _cashbookService.GetEntryByIdAsync(id);
            if (entry == null) return NotFound(new { message = "Cashbook entry not found" });
            return Ok(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cashbook entry by id");
            return StatusCode(500, new { message = "An error occurred while retrieving the cashbook entry", error = ex.Message });
        }
    }

    /**
     * Create a new cashbook entry
     * @param dto - Entry data
     */
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCashbookEntryDto dto)
    {
        try
        {
            if (dto == null) return BadRequest(new { message = "Request body is required" });

            var entry = await _cashbookService.CreateEntryAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, entry);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error creating cashbook entry");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cashbook entry");
            return StatusCode(500, new { message = "An error occurred while creating cashbook entry", error = ex.Message });
        }
    }

    /**
     * Update an existing cashbook entry
     * @param id - Entry ID
     * @param dto - Updated entry data
     */
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCashbookEntryDto dto)
    {
        try
        {
            if (dto == null) return BadRequest(new { message = "Request body is required" });

            var entry = await _cashbookService.UpdateEntryAsync(id, dto);
            if (entry == null) return NotFound(new { message = "Cashbook entry not found" });

            return Ok(entry);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error updating cashbook entry");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cashbook entry");
            return StatusCode(500, new { message = "An error occurred while updating the cashbook entry", error = ex.Message });
        }
    }

    /**
     * Delete a cashbook entry
     * @param id - Entry ID
     */
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _cashbookService.DeleteEntryAsync(id);
            if (!deleted) return NotFound(new { message = "Cashbook entry not found" });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cashbook entry");
            return StatusCode(500, new { message = "An error occurred while deleting the cashbook entry", error = ex.Message });
        }
    }

    /**
     * Get cashbook statistics
     * @param from - Optional start date filter
     * @param to - Optional end date filter
     */
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        try
        {
            var stats = await _cashbookService.GetStatisticsAsync(from, to);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cashbook statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving cashbook statistics", error = ex.Message });
        }
    }
}
