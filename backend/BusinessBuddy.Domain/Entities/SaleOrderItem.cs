namespace BusinessBuddy.Domain.Entities;

public class SaleOrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SaleOrderId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public Guid UnitId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; } = 0;
    public DiscountType DiscountType { get; set; } = DiscountType.Percent;
    public decimal Total { get; set; }
    public decimal? CostPrice { get; set; } // Giá vốn tại thời điểm bán (cho tính lãi gộp)
    public int? SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual SaleOrder SaleOrder { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual UnitOfMeasure Unit { get; set; } = null!;
}

