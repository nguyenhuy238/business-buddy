using BusinessBuddy.Application.DTOs;

namespace BusinessBuddy.Application.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync();
    Task<IEnumerable<RevenueByCategoryDto>> GetRevenueByCategoryAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<IEnumerable<RevenueByTimeDto>> GetRevenueByTimeAsync(int days = 30);
}

