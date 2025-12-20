namespace BusinessBuddy.Application.DTOs;

public class DashboardStatsDto
{
    public decimal TodayRevenue { get; set; }
    public int TodayOrders { get; set; }
    public decimal TodayProfit { get; set; }
    public decimal MonthRevenue { get; set; }
    public int MonthOrders { get; set; }
    public decimal MonthProfit { get; set; }
    public int LowStockProducts { get; set; }
    public decimal PendingReceivables { get; set; }
    public decimal PendingPayables { get; set; }
}

public class RevenueByCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Percentage { get; set; }
}

public class RevenueByTimeDto
{
    public string Period { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

