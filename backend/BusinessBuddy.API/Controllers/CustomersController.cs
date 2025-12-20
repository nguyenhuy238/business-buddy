using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(IUnitOfWork unitOfWork, ILogger<CustomersController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var customers = await _unitOfWork.Customers.GetAllAsync();
            return Ok(customers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customers");
            return StatusCode(500, "An error occurred while retrieving customers");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id);
            if (customer == null) return NotFound();
            return Ok(customer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customer by id");
            return StatusCode(500, "An error occurred while retrieving the customer");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer customer)
    {
        try
        {
            if (customer == null) return BadRequest();
            var created = await _unitOfWork.Customers.AddAsync(customer);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer");
            return StatusCode(500, "An error occurred while creating the customer");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Customer customer)
    {
        try
        {
            if (customer == null || id != customer.Id) return BadRequest();

            var existing = await _unitOfWork.Customers.GetByIdAsync(id);
            if (existing == null) return NotFound();

            // copy fields (simple approach)
            existing.Code = customer.Code;
            existing.Name = customer.Name;
            existing.Phone = customer.Phone;
            existing.Email = customer.Email;
            existing.Address = customer.Address;
            existing.Receivables = customer.Receivables;
            existing.IsActive = customer.IsActive;

            await _unitOfWork.Customers.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer");
            return StatusCode(500, "An error occurred while updating the customer");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _unitOfWork.Customers.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _unitOfWork.Customers.DeleteAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer");
            return StatusCode(500, "An error occurred while deleting the customer");
        }
    }
}
