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
public class PaymentSettingsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PaymentSettingsController> _logger;

    public PaymentSettingsController(
        IUnitOfWork unitOfWork, 
        ApplicationDbContext context, 
        IMapper mapper, 
        ILogger<PaymentSettingsController> logger)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /**
     * Get all payment settings
     */
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? paymentMethod = null)
    {
        try
        {
            var query = _context.PaymentSettings.AsQueryable();

            if (!string.IsNullOrEmpty(paymentMethod))
            {
                if (Enum.TryParse<PaymentMethod>(paymentMethod, true, out var method))
                {
                    query = query.Where(p => p.PaymentMethod == method);
                }
            }

            var settings = await query
                .Where(p => p.IsActive)
                .OrderBy(p => p.PaymentMethod)
                .ThenByDescending(p => p.IsDefault)
                .ToListAsync();

            var dtos = _mapper.Map<List<PaymentSettingsDto>>(settings);
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment settings");
            return StatusCode(500, "An error occurred while retrieving payment settings");
        }
    }

    /**
     * Get payment settings by ID
     */
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var setting = await _context.PaymentSettings
                .FirstOrDefaultAsync(p => p.Id == id);

            if (setting == null)
                return NotFound();

            var dto = _mapper.Map<PaymentSettingsDto>(setting);
            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment setting {Id}", id);
            return StatusCode(500, "An error occurred while retrieving the payment setting");
        }
    }

    /**
     * Get default payment settings for a payment method
     */
    [HttpGet("default/{paymentMethod}")]
    public async Task<IActionResult> GetDefault(string paymentMethod)
    {
        try
        {
            if (!Enum.TryParse<PaymentMethod>(paymentMethod, true, out var method))
            {
                return BadRequest($"Invalid payment method: {paymentMethod}");
            }

            var setting = await _context.PaymentSettings
                .FirstOrDefaultAsync(p => 
                    p.PaymentMethod == method && 
                    p.IsDefault && 
                    p.IsActive);

            if (setting == null)
                return NotFound($"No default payment settings found for {paymentMethod}");

            var dto = _mapper.Map<PaymentSettingsDto>(setting);
            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting default payment setting for {PaymentMethod}", paymentMethod);
            return StatusCode(500, "An error occurred while retrieving the default payment setting");
        }
    }

    /**
     * Create new payment settings
     */
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentSettingsDto dto)
    {
        try
        {
            if (dto == null)
                return BadRequest("Payment settings data is required");

            // Parse payment method
            var paymentMethod = ParseEnum<PaymentMethod>(dto.PaymentMethod, PaymentMethod.Cash);

            // If this is set as default, unset other defaults for the same payment method
            if (dto.IsDefault)
            {
                var existingDefaults = await _context.PaymentSettings
                    .Where(p => p.PaymentMethod == paymentMethod && p.IsDefault)
                    .ToListAsync();

                foreach (var existing in existingDefaults)
                {
                    existing.IsDefault = false;
                    existing.UpdatedAt = DateTime.UtcNow;
                    await _unitOfWork.PaymentSettings.UpdateAsync(existing);
                }
                
                // Save changes for existing defaults before creating new one
                if (existingDefaults.Count > 0)
                {
                    await _unitOfWork.SaveChangesAsync();
                }
            }

            var setting = _mapper.Map<PaymentSettings>(dto);
            setting.CreatedAt = DateTime.UtcNow;
            setting.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.PaymentSettings.AddAsync(setting);
            await _unitOfWork.SaveChangesAsync();

            var createdDto = _mapper.Map<PaymentSettingsDto>(setting);
            return CreatedAtAction(nameof(GetById), new { id = setting.Id }, createdDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment settings");
            return StatusCode(500, "An error occurred while creating the payment settings");
        }
    }

    /**
     * Update payment settings
     */
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePaymentSettingsDto dto)
    {
        try
        {
            if (dto == null)
                return BadRequest("Payment settings data is required");

            var existing = await _context.PaymentSettings
                .FirstOrDefaultAsync(p => p.Id == id);

            if (existing == null)
                return NotFound();

            // If setting as default, unset other defaults for the same payment method
            if (dto.IsDefault == true && !existing.IsDefault)
            {
                var otherDefaults = await _context.PaymentSettings
                    .Where(p => p.PaymentMethod == existing.PaymentMethod && p.Id != id && p.IsDefault)
                    .ToListAsync();

                foreach (var other in otherDefaults)
                {
                    other.IsDefault = false;
                    other.UpdatedAt = DateTime.UtcNow;
                }
            }

            _mapper.Map(dto, existing);
            existing.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.PaymentSettings.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            var updatedDto = _mapper.Map<PaymentSettingsDto>(existing);
            return Ok(updatedDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating payment settings {Id}", id);
            return StatusCode(500, "An error occurred while updating the payment settings");
        }
    }

    /**
     * Delete payment settings
     */
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var existing = await _context.PaymentSettings
                .FirstOrDefaultAsync(p => p.Id == id);

            if (existing == null)
                return NotFound();

            // Soft delete by setting IsActive to false
            existing.IsActive = false;
            existing.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.PaymentSettings.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting payment settings {Id}", id);
            return StatusCode(500, "An error occurred while deleting the payment settings");
        }
    }

    /**
     * Helper method to parse enum from string with fallback
     */
    private static T ParseEnum<T>(string value, T defaultValue) where T : struct, Enum
    {
        if (Enum.TryParse<T>(value, true, out var result))
        {
            return result;
        }
        return defaultValue;
    }
}

