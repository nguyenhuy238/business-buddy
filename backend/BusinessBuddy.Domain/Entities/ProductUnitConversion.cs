namespace BusinessBuddy.Domain.Entities;

public class ProductUnitConversion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid FromUnitId { get; set; }
    public Guid ToUnitId { get; set; }
    public decimal ConversionRate { get; set; } // e.g., 1 thùng = 24 chai
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual UnitOfMeasure FromUnit { get; set; } = null!;
    public virtual UnitOfMeasure ToUnit { get; set; } = null!;
}

