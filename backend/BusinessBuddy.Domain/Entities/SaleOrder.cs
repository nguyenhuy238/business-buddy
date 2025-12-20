namespace BusinessBuddy.Domain.Entities;

public enum PaymentMethod
{
    Cash,           // Tiền mặt
    BankTransfer,   // Chuyển khoản
    VietQR,         // VietQR
    Momo,           // Momo
    ZaloPay,        // ZaloPay
    Credit          // Công nợ
}

public enum SaleOrderStatus
{
    Draft,      // Nháp
    Completed,  // Hoàn thành
    Cancelled,  // Đã hủy
    Refunded    // Đã hoàn tiền
}

public enum DiscountType
{
    Percent,    // Phần trăm
    Amount      // Số tiền
}

public class SaleOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public SaleOrderStatus Status { get; set; } = SaleOrderStatus.Draft;
    public decimal Subtotal { get; set; } = 0;
    public decimal Discount { get; set; } = 0;
    public DiscountType DiscountType { get; set; } = DiscountType.Percent;
    public decimal Total { get; set; } = 0;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public decimal PaidAmount { get; set; } = 0;
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Customer? Customer { get; set; }
    public virtual ICollection<SaleOrderItem> Items { get; set; } = new List<SaleOrderItem>();
    public virtual ICollection<CashbookEntry> CashbookEntries { get; set; } = new List<CashbookEntry>();
}

