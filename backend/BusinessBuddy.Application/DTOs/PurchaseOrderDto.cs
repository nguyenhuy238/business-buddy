using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Application.DTOs;

/**
 * Purchase Order DTO for API responses
 */
public class PurchaseOrderDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<PurchaseOrderItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal PaidAmount { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/**
 * Purchase Order Item DTO
 */
public class PurchaseOrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public Guid UnitId { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal Total { get; set; }
}

/**
 * Create Purchase Order DTO
 */
public class CreatePurchaseOrderDto
{
    public Guid SupplierId { get; set; }
    public List<CreatePurchaseOrderItemDto> Items { get; set; } = new();
    public decimal Discount { get; set; } = 0;
    public string? DiscountType { get; set; } = "Percent";
    public string? PaymentMethod { get; set; } = "Cash";
    public string? Status { get; set; } = "Draft";
    public decimal PaidAmount { get; set; } = 0;
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = "System";
}

/**
 * Create Purchase Order Item DTO
 */
public class CreatePurchaseOrderItemDto
{
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public Guid UnitId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; } = 0;
    public string? DiscountType { get; set; } = "Percent";
}

/**
 * Update Purchase Order DTO
 */
public class UpdatePurchaseOrderDto
{
    public Guid? SupplierId { get; set; }
    public List<CreatePurchaseOrderItemDto>? Items { get; set; }
    public decimal? Discount { get; set; }
    public string? DiscountType { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Status { get; set; }
    public decimal? PaidAmount { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Notes { get; set; }
}

/**
 * Receive Goods DTO - for receiving goods from purchase order
 */
public class ReceiveGoodsDto
{
    public Guid WarehouseId { get; set; }
    public List<ReceiveGoodsItemDto> Items { get; set; } = new();
    public DateTime? ReceivedDate { get; set; }
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = "System";
}

/**
 * Receive Goods Item DTO
 */
public class ReceiveGoodsItemDto
{
    public Guid OrderItemId { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public DateTime? ExpiryDate { get; set; } // For batch tracking
}

/**
 * Create Payment DTO - for paying purchase order
 */
public class CreatePurchaseOrderPaymentDto
{
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public string? Description { get; set; }
    public DateTime? TransactionDate { get; set; }
    public string CreatedBy { get; set; } = "System";
}

