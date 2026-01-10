using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Application.DTOs;

public class SaleOrderDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<SaleOrderItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal PaidAmount { get; set; }
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SaleOrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public Guid UnitId { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal Total { get; set; }
}

public class CreateSaleOrderDto
{
    public Guid? CustomerId { get; set; }
    public List<CreateSaleOrderItemDto> Items { get; set; } = new();
    public decimal Discount { get; set; } = 0;
    public string? DiscountType { get; set; } = "Percent";
    public string? PaymentMethod { get; set; } = "Cash";
    public string? Status { get; set; } = "Completed";
    public decimal PaidAmount { get; set; }
    public DateTime? PaymentDueDate { get; set; } // Ngày đến hạn thanh toán cho đơn hàng nợ
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = "System";
}

public class CreateSaleOrderItemDto
{
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public Guid UnitId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; } = 0;
    public string? DiscountType { get; set; } = "Percent";
}

/**
 * DTO for a single line in a sale order refund (partial return)
 */
public class SaleOrderRefundItemDto
{
    public Guid OrderItemId { get; set; }
    public decimal Quantity { get; set; }
}

/**
 * Request DTO for creating a partial refund of a sale order
 * Allows returning specific quantities per line and optionally
 * updating customer receivables and creating a cashbook entry.
 */
public class CreateSaleOrderRefundDto
{
    public Guid OrderId { get; set; }
    public List<SaleOrderRefundItemDto> Items { get; set; } = new();
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public bool UpdateReceivables { get; set; } = true;
    public bool CreateCashbookEntry { get; set; } = true;
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "System";
}

