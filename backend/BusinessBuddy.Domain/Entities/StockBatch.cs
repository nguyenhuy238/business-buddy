namespace BusinessBuddy.Domain.Entities;

/// <summary>
/// Lô hàng để theo dõi FIFO
/// </summary>
public class StockBatch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufactureDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal Quantity { get; set; }
    public decimal CostPrice { get; set; } // Giá vốn của lô này
    public decimal RemainingQuantity { get; set; }
    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}

