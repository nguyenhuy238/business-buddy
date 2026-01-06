namespace BusinessBuddy.Domain.Entities;

/**
 * Transaction type for receivables
 */
public enum ReceivableTransactionType
{
    Invoice,     // Phát sinh công nợ từ đơn hàng
    Payment,    // Thu tiền công nợ
    Adjustment, // Điều chỉnh công nợ
    Refund      // Hoàn tiền
}

/**
 * ReceivableTransaction entity
 * Tracks all transactions related to customer receivables (debt owed by customers)
 */
public class ReceivableTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public ReceivableTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; } // Số dư công nợ trước giao dịch
    public decimal BalanceAfter { get; set; } // Số dư công nợ sau giao dịch
    public string Description { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public DateTime? DueDate { get; set; } // Ngày đến hạn thanh toán
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    
    // Reference to related entities
    public string? ReferenceType { get; set; } // SaleOrder, etc.
    public Guid? ReferenceId { get; set; } // ID of related entity
    
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual SaleOrder? SaleOrder { get; set; }
    public virtual CashbookEntry? CashbookEntry { get; set; }
}

