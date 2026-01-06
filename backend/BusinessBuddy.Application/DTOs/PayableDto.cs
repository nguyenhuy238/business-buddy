using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Application.DTOs;

/**
 * DTO for supplier payable summary
 */
public class PayableDto
{
    public Guid SupplierId { get; set; }
    public string SupplierCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? SupplierPhone { get; set; }
    public decimal TotalPayables { get; set; }
    public decimal OverdueAmount { get; set; } // Số tiền quá hạn
    public DateTime? PaymentDueDate { get; set; }
    public int OverdueDays { get; set; } // Số ngày quá hạn
    public bool IsOverdue { get; set; }
}

/**
 * DTO for payable transaction
 */
public class PayableTransactionDto
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
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
 * DTO for creating a payment (paying payables)
 */
public class CreatePayablePaymentDto
{
    public Guid SupplierId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
}

/**
 * DTO for payable adjustment
 */
public class CreatePayableAdjustmentDto
{
    public Guid SupplierId { get; set; }
    public decimal Amount { get; set; } // Positive for increase, negative for decrease
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
}

