namespace BusinessBuddy.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public Guid UnitId { get; set; }
    public Guid? BaseUnitId { get; set; }
    public decimal ConversionRate { get; set; } = 1; // e.g., 1 thùng = 24 chai
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int MinStock { get; set; } = 0;
    public string? ImageUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsCombo { get; set; } = false; // Combo/Bundle flag
    public string? CostMethod { get; set; } = "SIMPLE"; // SIMPLE or FIFO
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Category Category { get; set; } = null!;
    public virtual UnitOfMeasure Unit { get; set; } = null!;
    public virtual UnitOfMeasure? BaseUnit { get; set; }
    public virtual ICollection<Stock> Stocks { get; set; } = new List<Stock>();
    public virtual ICollection<ProductUnitConversion> UnitConversions { get; set; } = new List<ProductUnitConversion>();
    public virtual ICollection<ComboItem> ComboItems { get; set; } = new List<ComboItem>(); // Items in this combo
    public virtual ICollection<ComboItem> InCombos { get; set; } = new List<ComboItem>(); // Combos containing this product
    public virtual ICollection<SaleOrderItem> SaleOrderItems { get; set; } = new List<SaleOrderItem>();
    public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    public virtual ICollection<StockBatch> StockBatches { get; set; } = new List<StockBatch>(); // For FIFO tracking
}

