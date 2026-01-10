namespace BusinessBuddy.Domain.Entities;

/**
 * Return Order Item Entity
 * Represents a single item in a return order
 */
public class ReturnOrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReturnOrderId { get; set; }
    public Guid SaleOrderItemId { get; set; } // Reference to original sale order item
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public Guid UnitId { get; set; }
    public decimal UnitPrice { get; set; } // Price at the time of return (from original sale)
    public decimal Total { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ReturnOrder ReturnOrder { get; set; } = null!;
    public virtual SaleOrderItem SaleOrderItem { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual UnitOfMeasure Unit { get; set; } = null!;
}

