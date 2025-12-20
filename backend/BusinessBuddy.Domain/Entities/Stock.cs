namespace BusinessBuddy.Domain.Entities;

public class Stock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public string? ShelfLocation { get; set; } // Vị trí kệ
    public decimal Quantity { get; set; } = 0;
    public decimal ReservedQuantity { get; set; } = 0; // Số lượng đã được đặt trước
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Warehouse Warehouse { get; set; } = null!;
}

