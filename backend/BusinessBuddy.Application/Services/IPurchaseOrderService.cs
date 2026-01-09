using BusinessBuddy.Application.DTOs;

namespace BusinessBuddy.Application.Services;

/**
 * Service interface for purchase order operations
 */
public interface IPurchaseOrderService
{
    /**
     * Get all purchase orders with optional filters
     * @param supplierId - Optional supplier ID filter
     * @param status - Optional status filter
     * @param from - Optional start date filter
     * @param to - Optional end date filter
     * @param page - Page number
     * @param pageSize - Items per page
     * @returns Purchase orders with pagination info
     */
    Task<(int Total, List<PurchaseOrderDto> Items)> GetAllAsync(
        Guid? supplierId = null,
        string? status = null,
        DateTime? from = null,
        DateTime? to = null,
        int page = 1,
        int pageSize = 50);

    /**
     * Get a purchase order by ID
     * @param id - Purchase order ID
     * @returns Purchase order or null if not found
     */
    Task<PurchaseOrderDto?> GetByIdAsync(Guid id);

    /**
     * Create a new purchase order
     * @param dto - Purchase order data
     * @returns Created purchase order
     */
    Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto dto);

    /**
     * Update an existing purchase order
     * @param id - Purchase order ID
     * @param dto - Updated purchase order data
     * @returns Updated purchase order or null if not found
     */
    Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto dto);

    /**
     * Delete a purchase order
     * @param id - Purchase order ID
     * @returns True if deleted, false if not found
     */
    Task<bool> DeleteAsync(Guid id);

    /**
     * Receive goods from purchase order
     * @param id - Purchase order ID
     * @param dto - Receive goods data
     * @returns Updated purchase order or null if not found
     */
    Task<PurchaseOrderDto?> ReceiveGoodsAsync(Guid id, ReceiveGoodsDto dto);

    /**
     * Create payment for purchase order
     * @param id - Purchase order ID
     * @param dto - Payment data
     * @returns Updated purchase order or null if not found
     */
    Task<PurchaseOrderDto?> CreatePaymentAsync(Guid id, CreatePurchaseOrderPaymentDto dto);
}

