using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Application.DTOs;

/**
 * Cashbook entry DTO for API responses
 */
public class CashbookEntryDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty; // "Income" or "Expense"
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? BankAccount { get; set; }
    public DateTime TransactionDate { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/**
 * DTO for creating a new cashbook entry
 */
public class CreateCashbookEntryDto
{
    public string Type { get; set; } = "Income"; // "Income" or "Expense"
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "Cash";
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? BankAccount { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "System";
}

/**
 * DTO for updating an existing cashbook entry
 */
public class UpdateCashbookEntryDto
{
    public string? Type { get; set; }
    public string? Category { get; set; }
    public decimal? Amount { get; set; }
    public string? Description { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? BankAccount { get; set; }
    public DateTime? TransactionDate { get; set; }
    public string? CreatedBy { get; set; }
}

/**
 * DTO for cashbook statistics
 */
public class CashbookStatsDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal Balance { get; set; }
    public int TotalTransactions { get; set; }
    public decimal TodayIncome { get; set; }
    public decimal TodayExpense { get; set; }
    public decimal TodayBalance { get; set; }
    public int TodayTransactions { get; set; }
    public Dictionary<string, decimal> IncomeByCategory { get; set; } = new();
    public Dictionary<string, decimal> ExpenseByCategory { get; set; } = new();
}

