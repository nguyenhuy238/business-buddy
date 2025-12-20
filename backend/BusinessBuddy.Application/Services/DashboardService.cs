using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.EntityFrameworkCore;

namespace BusinessBuddy.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;

    public DashboardService(IUnitOfWork unitOfWork, ApplicationDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var today = DateTime.Today;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);
        var endOfToday = today.AddDays(1);

        // Today stats
        var todayOrders = await _context.SaleOrders
            .Where(o => o.CreatedAt >= today && o.CreatedAt < endOfToday && o.Status == SaleOrderStatus.Completed)
            .ToListAsync();

        var todayRevenue = todayOrders.Sum(o => o.Total);
        var todayProfit = todayOrders.Sum(o => o.Items.Sum(i => 
            (i.UnitPrice - (i.CostPrice ?? 0)) * i.Quantity));

        // Month stats
        var monthOrders = await _context.SaleOrders
            .Where(o => o.CreatedAt >= startOfMonth && o.CreatedAt < endOfToday && o.Status == SaleOrderStatus.Completed)
            .ToListAsync();

        var monthRevenue = monthOrders.Sum(o => o.Total);
        var monthProfit = monthOrders.Sum(o => o.Items.Sum(i => 
            (i.UnitPrice - (i.CostPrice ?? 0)) * i.Quantity));

        // Low stock products
        var lowStockProducts = await _context.Products
            .Where(p => p.IsActive)
            .ToListAsync();

        var lowStockCount = 0;
        foreach (var product in lowStockProducts)
        {
            var totalStock = await _context.Stocks
                .Where(s => s.ProductId == product.Id)
                .SumAsync(s => s.Quantity);
            
            if (totalStock <= product.MinStock)
                lowStockCount++;
        }

        // Receivables and Payables
        var pendingReceivables = await _context.Customers.SumAsync(c => c.Receivables);
        var pendingPayables = await _context.Suppliers.SumAsync(s => s.Payables);

        return new DashboardStatsDto
        {
            TodayRevenue = todayRevenue,
            TodayOrders = todayOrders.Count,
            TodayProfit = todayProfit,
            MonthRevenue = monthRevenue,
            MonthOrders = monthOrders.Count,
            MonthProfit = monthProfit,
            LowStockProducts = lowStockCount,
            PendingReceivables = pendingReceivables,
            PendingPayables = pendingPayables
        };
    }

    public async Task<IEnumerable<RevenueByCategoryDto>> GetRevenueByCategoryAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.Today.AddMonths(-1);
        endDate ??= DateTime.Today.AddDays(1);

        var revenueByCategory = await _context.SaleOrderItems
            .Include(i => i.SaleOrder)
            .Include(i => i.Product)
            .ThenInclude(p => p.Category)
            .Where(i => i.SaleOrder.CreatedAt >= startDate && 
                       i.SaleOrder.CreatedAt < endDate && 
                       i.SaleOrder.Status == SaleOrderStatus.Completed)
            .GroupBy(i => i.Product.Category.Name)
            .Select(g => new
            {
                Category = g.Key,
                Revenue = g.Sum(i => i.Total)
            })
            .ToListAsync();

        var totalRevenue = revenueByCategory.Sum(r => r.Revenue);

        return revenueByCategory.Select(r => new RevenueByCategoryDto
        {
            Category = r.Category,
            Revenue = r.Revenue,
            Percentage = totalRevenue > 0 ? (r.Revenue / totalRevenue * 100) : 0
        });
    }

    public async Task<IEnumerable<RevenueByTimeDto>> GetRevenueByTimeAsync(int days = 30)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var startDate = today.AddDays(-days);
            var endDate = today.AddDays(1);

            // Load orders first, then group in memory to avoid EF Core grouping issues
            var orders = await _context.SaleOrders
                .Where(o => o.CreatedAt >= startDate && 
                           o.CreatedAt < endDate && 
                           o.Status == SaleOrderStatus.Completed)
                .Select(o => new { o.CreatedAt, o.Total })
                .ToListAsync();

            var revenues = orders
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new RevenueByTimeDto
                {
                    Period = g.Key.ToString("dd/MM/yyyy"),
                    Revenue = g.Sum(o => o.Total),
                    Orders = g.Count()
                })
                .OrderBy(r => r.Period)
                .ToList();

            return revenues;
        }
        catch (Exception ex)
        {
            // Log error and return empty list
            System.Diagnostics.Debug.WriteLine($"Error in GetRevenueByTimeAsync: {ex.Message}");
            System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");
            return Enumerable.Empty<RevenueByTimeDto>();
        }
    }
}

