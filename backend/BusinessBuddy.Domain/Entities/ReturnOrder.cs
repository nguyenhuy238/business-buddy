namespace BusinessBuddy.Domain.Entities;

/**
 * Return Order Status
 */
public enum ReturnOrderStatus
{
    Draft,      // Nháp
    Completed,  // Hoàn thành
    Cancelled   // Đã hủy
}

/**
 * Return Order Entity
 * Represents a return order (refund) for a sale order
 */
public class ReturnOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public Guid SaleOrderId { get; set; }
    public Guid? CustomerId { get; set; }
    public ReturnOrderStatus Status { get; set; } = ReturnOrderStatus.Draft;
    public decimal Subtotal { get; set; } = 0;
    public decimal Total { get; set; } = 0;
    public PaymentMethod RefundMethod { get; set; } = PaymentMethod.Cash;
    public decimal RefundAmount { get; set; } = 0;
    public string Reason { get; set; } = string.Empty; // Lý do trả hàng
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual SaleOrder SaleOrder { get; set; } = null!;
    public virtual Customer? Customer { get; set; }
    public virtual ICollection<ReturnOrderItem> Items { get; set; } = new List<ReturnOrderItem>();
}

