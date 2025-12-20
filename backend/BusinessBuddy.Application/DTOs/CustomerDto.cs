namespace BusinessBuddy.Application.DTOs;

public class CustomerDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string MembershipTier { get; set; } = string.Empty;
    public int Points { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal Receivables { get; set; }
    public DateTime? PaymentDueDate { get; set; }
    public string? ZaloId { get; set; }
    public DateTime? Birthday { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCustomerDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string MembershipTier { get; set; } = "Bronze";
    public string? ZaloId { get; set; }
    public DateTime? Birthday { get; set; }
    public string? Notes { get; set; }
}

public class UpdateCustomerDto
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? MembershipTier { get; set; }
    public string? ZaloId { get; set; }
    public DateTime? Birthday { get; set; }
    public string? Notes { get; set; }
    public bool? IsActive { get; set; }
}

