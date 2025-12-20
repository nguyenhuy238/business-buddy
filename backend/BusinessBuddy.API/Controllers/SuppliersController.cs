using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(IUnitOfWork unitOfWork, ILogger<SuppliersController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var suppliers = await _unitOfWork.Suppliers.GetAllAsync();
            return Ok(suppliers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting suppliers");
            return StatusCode(500, "An error occurred while retrieving suppliers");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
            if (supplier == null) return NotFound();
            return Ok(supplier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting supplier by id");
            return StatusCode(500, "An error occurred while retrieving the supplier");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Supplier supplier)
    {
        try
        {
            if (supplier == null) return BadRequest();
            var created = await _unitOfWork.Suppliers.AddAsync(supplier);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier");
            return StatusCode(500, "An error occurred while creating the supplier");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Supplier supplier)
    {
        try
        {
            if (supplier == null || id != supplier.Id) return BadRequest();

            var existing = await _unitOfWork.Suppliers.GetByIdAsync(id);
            if (existing == null) return NotFound();

            existing.Code = supplier.Code;
            existing.Name = supplier.Name;
            existing.Phone = supplier.Phone;
            existing.Email = supplier.Email;
            existing.Address = supplier.Address;
            existing.Payables = supplier.Payables;
            existing.IsActive = supplier.IsActive;

            await _unitOfWork.Suppliers.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating supplier");
            return StatusCode(500, "An error occurred while updating the supplier");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _unitOfWork.Suppliers.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _unitOfWork.Suppliers.DeleteAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting supplier");
            return StatusCode(500, "An error occurred while deleting the supplier");
        }
    }
}
