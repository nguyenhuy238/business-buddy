using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Application.DTOs;

/**
 * DTO for customer receivable summary
 */
public class ReceivableDto
{
    public Guid CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public decimal TotalReceivables { get; set; }
    public decimal OverdueAmount { get; set; } // Số tiền quá hạn
    public DateTime? PaymentDueDate { get; set; }
    public int OverdueDays { get; set; } // Số ngày quá hạn
    public bool IsOverdue { get; set; }
}

/**
 * DTO for receivable transaction
 */
public class ReceivableTransactionDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string Description { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceCode { get; set; } // Code of referenced entity
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/**
 * DTO for creating a payment (collecting receivables)
 */
public class CreateReceivablePaymentDto
{
    public Guid CustomerId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
}

/**
 * DTO for receivable adjustment
 */
public class CreateReceivableAdjustmentDto
{
    public Guid CustomerId { get; set; }
    public decimal Amount { get; set; } // Positive for increase, negative for decrease
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
}

