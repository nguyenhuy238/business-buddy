using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CashbookController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CashbookController> _logger;

    public CashbookController(IUnitOfWork unitOfWork, ILogger<CashbookController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        try
        {
            var entries = await _unitOfWork.CashbookEntries.GetAllAsync();
            var query = entries.AsQueryable();
            if (from.HasValue)
                query = query.Where(e => e.TransactionDate >= from.Value);
            if (to.HasValue)
                query = query.Where(e => e.TransactionDate <= to.Value);
            return Ok(query.OrderByDescending(e => e.TransactionDate));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cashbook entries");
            return StatusCode(500, "An error occurred while retrieving cashbook entries");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var entry = await _unitOfWork.CashbookEntries.GetByIdAsync(id);
            if (entry == null) return NotFound();
            return Ok(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cashbook entry by id");
            return StatusCode(500, "An error occurred while retrieving the cashbook entry");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CashbookEntry entry)
    {
        try
        {
            if (entry == null) return BadRequest();
            entry.CreatedAt = DateTime.UtcNow;
            await _unitOfWork.CashbookEntries.AddAsync(entry);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cashbook entry");
            return StatusCode(500, "An error occurred while creating cashbook entry");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CashbookEntry entry)
    {
        try
        {
            if (entry == null || id != entry.Id) return BadRequest();

            var existing = await _unitOfWork.CashbookEntries.GetByIdAsync(id);
            if (existing == null) return NotFound();

            // Update fields
            existing.Type = entry.Type;
            existing.Category = entry.Category;
            existing.Amount = entry.Amount;
            existing.Description = entry.Description;
            existing.PaymentMethod = entry.PaymentMethod;
            existing.ReferenceType = entry.ReferenceType;
            existing.ReferenceId = entry.ReferenceId;
            existing.BankAccount = entry.BankAccount;
            existing.TransactionDate = entry.TransactionDate;
            existing.CreatedBy = entry.CreatedBy;

            await _unitOfWork.CashbookEntries.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cashbook entry");
            return StatusCode(500, "An error occurred while updating the cashbook entry");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _unitOfWork.CashbookEntries.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _unitOfWork.CashbookEntries.DeleteAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cashbook entry");
            return StatusCode(500, "An error occurred while deleting the cashbook entry");
        }
    }
}
