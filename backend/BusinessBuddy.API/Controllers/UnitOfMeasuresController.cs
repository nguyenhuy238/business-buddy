using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

/// <summary>
/// Controller for managing units of measure
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UnitOfMeasuresController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UnitOfMeasuresController> _logger;

    public UnitOfMeasuresController(IUnitOfWork unitOfWork, ILogger<UnitOfMeasuresController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Get all units of measure
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        try
        {
            var units = await _unitOfWork.UnitOfMeasures.GetAllAsync();
            var filtered = includeInactive 
                ? units 
                : units.Where(u => u.IsActive);
            return Ok(filtered);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting units of measure");
            return StatusCode(500, "An error occurred while retrieving units of measure");
        }
    }

    /// <summary>
    /// Get unit of measure by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var unit = await _unitOfWork.UnitOfMeasures.GetByIdAsync(id);
            if (unit == null) return NotFound();
            return Ok(unit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unit of measure by id");
            return StatusCode(500, "An error occurred while retrieving the unit of measure");
        }
    }

    /// <summary>
    /// Create a new unit of measure
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UnitOfMeasure unit)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(unit.Code))
            {
                return BadRequest("Unit code is required");
            }

            if (string.IsNullOrWhiteSpace(unit.Name))
            {
                return BadRequest("Unit name is required");
            }

            // Check if code already exists
            var existing = (await _unitOfWork.UnitOfMeasures.GetAllAsync())
                .FirstOrDefault(u => u.Code == unit.Code);
            if (existing != null)
            {
                return BadRequest($"Unit of measure with code '{unit.Code}' already exists");
            }

            var created = await _unitOfWork.UnitOfMeasures.AddAsync(unit);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating unit of measure");
            return StatusCode(500, "An error occurred while creating the unit of measure");
        }
    }

    /// <summary>
    /// Update an existing unit of measure
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UnitOfMeasure unit)
    {
        try
        {
            var existing = await _unitOfWork.UnitOfMeasures.GetByIdAsync(id);
            if (existing == null) return NotFound();

            if (string.IsNullOrWhiteSpace(unit.Name))
            {
                return BadRequest("Unit name is required");
            }

            // Check if code already exists (excluding current unit)
            if (!string.IsNullOrWhiteSpace(unit.Code) && unit.Code != existing.Code)
            {
                var codeExists = (await _unitOfWork.UnitOfMeasures.GetAllAsync())
                    .Any(u => u.Code == unit.Code && u.Id != id);
                if (codeExists)
                {
                    return BadRequest($"Unit of measure with code '{unit.Code}' already exists");
                }
            }

            existing.Code = unit.Code;
            existing.Name = unit.Name;
            existing.Description = unit.Description;
            existing.IsActive = unit.IsActive;

            await _unitOfWork.UnitOfMeasures.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return Ok(existing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating unit of measure");
            return StatusCode(500, "An error occurred while updating the unit of measure");
        }
    }

    /// <summary>
    /// Delete a unit of measure
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _unitOfWork.UnitOfMeasures.GetByIdAsync(id);
            if (existing == null) return NotFound();

            // Check if unit is used by products
            var hasProducts = (await _unitOfWork.Products.GetAllAsync())
                .Any(p => p.UnitId == id || p.BaseUnitId == id);
            if (hasProducts)
            {
                return BadRequest("Cannot delete unit of measure that is used by products. Please reassign products first.");
            }

            await _unitOfWork.UnitOfMeasures.DeleteAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting unit of measure");
            return StatusCode(500, "An error occurred while deleting the unit of measure");
        }
    }
}

