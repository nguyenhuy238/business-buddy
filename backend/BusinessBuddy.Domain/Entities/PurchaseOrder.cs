namespace BusinessBuddy.Domain.Entities;

public enum PurchaseOrderStatus
{
    Draft,          // Nháp
    Ordered,        // Đã đặt
    Received,       // Đã nhận
    PartialReceived, // Nhận một phần
    Cancelled       // Đã hủy
}

public class PurchaseOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public decimal Subtotal { get; set; } = 0;
    public decimal Discount { get; set; } = 0;
    public DiscountType DiscountType { get; set; } = DiscountType.Percent;
    public decimal Total { get; set; } = 0;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public decimal PaidAmount { get; set; } = 0;
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Supplier Supplier { get; set; } = null!;
    public virtual ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    public virtual ICollection<CashbookEntry> CashbookEntries { get; set; } = new List<CashbookEntry>();
}

