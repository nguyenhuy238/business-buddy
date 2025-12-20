namespace BusinessBuddy.Domain.Entities;

public enum StockTransactionType
{
    In,          // Nhập kho
    Out,         // Xuất kho
    Adjustment,  // Điều chỉnh
    Transfer,    // Chuyển kho
    Inventory    // Kiểm kê
}

public class StockTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? BatchId { get; set; }
    public StockTransactionType Type { get; set; }
    public decimal Quantity { get; set; }
    public decimal? CostPrice { get; set; }
    public string? ReferenceType { get; set; } // SaleOrder, PurchaseOrder, etc.
    public Guid? ReferenceId { get; set; }
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual StockBatch? Batch { get; set; }
}

