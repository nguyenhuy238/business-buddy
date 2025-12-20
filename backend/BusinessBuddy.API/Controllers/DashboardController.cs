using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        try
        {
            var stats = await _dashboardService.GetDashboardStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard stats");
            return StatusCode(500, "An error occurred while retrieving dashboard stats");
        }
    }

    [HttpGet("revenue-by-category")]
    public async Task<ActionResult<IEnumerable<RevenueByCategoryDto>>> GetRevenueByCategory(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var revenue = await _dashboardService.GetRevenueByCategoryAsync(startDate, endDate);
            return Ok(revenue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting revenue by category");
            return StatusCode(500, "An error occurred while retrieving revenue by category");
        }
    }

    [HttpGet("revenue-by-time")]
    public async Task<ActionResult<IEnumerable<RevenueByTimeDto>>> GetRevenueByTime([FromQuery] int days = 30)
    {
        try
        {
            var revenue = await _dashboardService.GetRevenueByTimeAsync(days);
            return Ok(revenue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting revenue by time: {Message}", ex.Message);
            _logger.LogError(ex, "Stack trace: {StackTrace}", ex.StackTrace);
            return StatusCode(500, $"An error occurred while retrieving revenue by time: {ex.Message}");
        }
    }
}

