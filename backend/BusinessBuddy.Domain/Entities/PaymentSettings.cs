namespace BusinessBuddy.Domain.Entities;

/**
 * Payment settings entity
 * Stores payment account information for different payment methods
 */
public class PaymentSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /**
     * Payment method this setting is for
     */
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    
    /**
     * Bank name (for BankTransfer, VietQR)
     */
    public string? BankName { get; set; }
    
    /**
     * Bank code (for VietQR)
     */
    public string? BankCode { get; set; }
    
    /**
     * Account number (for BankTransfer, VietQR) or phone number (for e-wallet)
     */
    public string AccountNumber { get; set; } = string.Empty;
    
    /**
     * Account holder name
     */
    public string AccountName { get; set; } = string.Empty;
    
    /**
     * Phone number (for e-wallet like Momo, ZaloPay)
     */
    public string? PhoneNumber { get; set; }
    
    /**
     * QR code template or additional info
     */
    public string? QrTemplate { get; set; }
    
    /**
     * Is this the default account for this payment method
     */
    public bool IsDefault { get; set; } = false;
    
    /**
     * Is this setting active
     */
    public bool IsActive { get; set; } = true;
    
    /**
     * Additional notes
     */
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

