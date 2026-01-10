using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Application.DTOs;

/**
 * Return Order DTO for API responses
 */
public class ReturnOrderDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid SaleOrderId { get; set; }
    public string SaleOrderCode { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ReturnOrderItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }
    public string RefundMethod { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/**
 * Return Order Item DTO
 */
public class ReturnOrderItemDto
{
    public Guid Id { get; set; }
    public Guid SaleOrderItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public Guid UnitId { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
    public string? Notes { get; set; }
}

/**
 * Create Return Order DTO
 */
public class CreateReturnOrderDto
{
    public Guid SaleOrderId { get; set; }
    public List<CreateReturnOrderItemDto> Items { get; set; } = new();
    public PaymentMethod RefundMethod { get; set; } = PaymentMethod.Cash;
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool UpdateReceivables { get; set; } = true;
    public bool CreateCashbookEntry { get; set; } = true;
    public string CreatedBy { get; set; } = "System";
}

/**
 * Create Return Order Item DTO
 */
public class CreateReturnOrderItemDto
{
    public Guid SaleOrderItemId { get; set; }
    public decimal Quantity { get; set; }
    public string? Notes { get; set; }
}

