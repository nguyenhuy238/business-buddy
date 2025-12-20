namespace BusinessBuddy.Domain.Entities;

public enum CashbookEntryType
{
    Income,  // Thu
    Expense  // Chi
}

public enum ExpenseCategory
{
    Rent,           // Thuê mặt bằng
    Utilities,      // Điện nước
    Salary,         // Lương nhân viên
    Marketing,      // Marketing
    Supplies,       // Vật tư
    Maintenance,    // Sửa chữa
    Tax,            // Thuế
    Other           // Khác
}

public class CashbookEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CashbookEntryType Type { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public string? ReferenceType { get; set; } // SaleOrder, PurchaseOrder, etc.
    public Guid? ReferenceId { get; set; }
    public string? BankAccount { get; set; } // Số tài khoản ngân hàng
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual SaleOrder? SaleOrder { get; set; }
    public virtual PurchaseOrder? PurchaseOrder { get; set; }
}

