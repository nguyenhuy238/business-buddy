namespace BusinessBuddy.Domain.Entities;

public enum MembershipTier
{
    Bronze,
    Silver,
    Gold,
    Platinum
}

public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public MembershipTier MembershipTier { get; set; } = MembershipTier.Bronze;
    public int Points { get; set; } = 0;
    public decimal TotalSpent { get; set; } = 0;
    public decimal Receivables { get; set; } = 0; // Công nợ phải thu
    public DateTime? PaymentDueDate { get; set; }
    public string? ZaloId { get; set; }
    public DateTime? Birthday { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<SaleOrder> SaleOrders { get; set; } = new List<SaleOrder>();
    public virtual ICollection<ReceivableTransaction> ReceivableTransactions { get; set; } = new List<ReceivableTransaction>();
}

