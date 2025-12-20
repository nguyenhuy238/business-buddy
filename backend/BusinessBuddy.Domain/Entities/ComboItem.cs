namespace BusinessBuddy.Domain.Entities;

public class ComboItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComboProductId { get; set; } // The combo/bundle product
    public Guid ProductId { get; set; } // The item in the combo
    public decimal Quantity { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Product ComboProduct { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}

