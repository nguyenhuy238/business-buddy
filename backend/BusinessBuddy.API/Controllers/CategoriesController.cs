using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

/// <summary>
/// Controller for managing product categories
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(IUnitOfWork unitOfWork, ILogger<CategoriesController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Get all categories
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        try
        {
            var categories = await _unitOfWork.Categories.GetAllAsync();
            var filtered = includeInactive 
                ? categories 
                : categories.Where(c => c.IsActive);
            return Ok(filtered);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, "An error occurred while retrieving categories");
        }
    }

    /// <summary>
    /// Get category by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id);
            if (category == null) return NotFound();
            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category by id");
            return StatusCode(500, "An error occurred while retrieving the category");
        }
    }

    /// <summary>
    /// Create a new category
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Category category)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(category.Code))
            {
                return BadRequest("Category code is required");
            }

            if (string.IsNullOrWhiteSpace(category.Name))
            {
                return BadRequest("Category name is required");
            }

            // Check if code already exists
            var existing = (await _unitOfWork.Categories.GetAllAsync())
                .FirstOrDefault(c => c.Code == category.Code);
            if (existing != null)
            {
                return BadRequest($"Category with code '{category.Code}' already exists");
            }

            // Validate parent if provided
            if (category.ParentId.HasValue)
            {
                var parent = await _unitOfWork.Categories.GetByIdAsync(category.ParentId.Value);
                if (parent == null)
                {
                    return BadRequest("Parent category not found");
                }
            }

            var created = await _unitOfWork.Categories.AddAsync(category);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, "An error occurred while creating the category");
        }
    }

    /// <summary>
    /// Update an existing category
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Category category)
    {
        try
        {
            var existing = await _unitOfWork.Categories.GetByIdAsync(id);
            if (existing == null) return NotFound();

            if (string.IsNullOrWhiteSpace(category.Name))
            {
                return BadRequest("Category name is required");
            }

            // Check if code already exists (excluding current category)
            if (!string.IsNullOrWhiteSpace(category.Code) && category.Code != existing.Code)
            {
                var codeExists = (await _unitOfWork.Categories.GetAllAsync())
                    .Any(c => c.Code == category.Code && c.Id != id);
                if (codeExists)
                {
                    return BadRequest($"Category with code '{category.Code}' already exists");
                }
            }

            // Validate parent if provided (prevent circular reference)
            if (category.ParentId.HasValue)
            {
                if (category.ParentId.Value == id)
                {
                    return BadRequest("Category cannot be its own parent");
                }

                var parent = await _unitOfWork.Categories.GetByIdAsync(category.ParentId.Value);
                if (parent == null)
                {
                    return BadRequest("Parent category not found");
                }
            }

            existing.Code = category.Code;
            existing.Name = category.Name;
            existing.Description = category.Description;
            existing.ParentId = category.ParentId;
            existing.Color = category.Color;
            existing.Icon = category.Icon;
            existing.IsActive = category.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Categories.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return Ok(existing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category");
            return StatusCode(500, "An error occurred while updating the category");
        }
    }

    /// <summary>
    /// Delete a category
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _unitOfWork.Categories.GetByIdAsync(id);
            if (existing == null) return NotFound();

            // Check if category has products
            var hasProducts = (await _unitOfWork.Products.GetAllAsync())
                .Any(p => p.CategoryId == id);
            if (hasProducts)
            {
                return BadRequest("Cannot delete category that has products. Please reassign or delete products first.");
            }

            // Check if category has children
            var hasChildren = (await _unitOfWork.Categories.GetAllAsync())
                .Any(c => c.ParentId == id);
            if (hasChildren)
            {
                return BadRequest("Cannot delete category that has subcategories. Please delete or reassign subcategories first.");
            }

            await _unitOfWork.Categories.DeleteAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category");
            return StatusCode(500, "An error occurred while deleting the category");
        }
    }
}

