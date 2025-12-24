namespace BusinessBuddy.Application.DTOs;

/**
 * Payment settings DTO
 */
public class PaymentSettingsDto
{
    public Guid Id { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? BankCode { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? QrTemplate { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/**
 * Create payment settings DTO
 */
public class CreatePaymentSettingsDto
{
    public string PaymentMethod { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? BankCode { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? QrTemplate { get; set; }
    public bool IsDefault { get; set; } = false;
    public string? Notes { get; set; }
}

/**
 * Update payment settings DTO
 */
public class UpdatePaymentSettingsDto
{
    public string? BankName { get; set; }
    public string? BankCode { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? QrTemplate { get; set; }
    public bool? IsDefault { get; set; }
    public bool? IsActive { get; set; }
    public string? Notes { get; set; }
}

