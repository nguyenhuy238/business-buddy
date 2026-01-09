/**
 * Sale Order Service
 * Handles sale order API calls
 */
import { apiClient } from "./api";
import type { PaymentMethod, SaleOrder } from "@/types";

/**
 * Sale orders response with pagination
 */
export interface SaleOrdersResponse {
  total: number;
  items: SaleOrder[];
}

/**
 * Get all sale orders with optional filters
 * @param customerId - Optional customer ID filter
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 50)
 * @returns Sale orders with pagination info
 */
export async function getSaleOrders(
  customerId?: string,
  from?: Date,
  to?: Date,
  page = 1,
  pageSize = 50
): Promise<SaleOrdersResponse> {
  const params: Record<string, string | number> = { page, pageSize };
  
  if (customerId) {
    params.customerId = customerId;
  }
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<SaleOrdersResponse>("/SaleOrders", params);
}

/**
 * Get a sale order by ID
 * @param id - Sale order ID
 * @returns Sale order or null if not found
 */
export async function getSaleOrderById(id: string): Promise<SaleOrder | null> {
  try {
    return await apiClient.get<SaleOrder>(`/SaleOrders/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new sale order
 * @param order - Sale order data
 * @returns Created sale order
 */
export async function createSaleOrder(order: Partial<SaleOrder>): Promise<SaleOrder> {
  return apiClient.post<SaleOrder>("/SaleOrders", order);
}

/**
 * Update an existing sale order
 * @param id - Sale order ID
 * @param order - Sale order data to update
 * @returns Updated sale order
 */
export async function updateSaleOrder(id: string, order: Partial<SaleOrder>): Promise<SaleOrder> {
  return apiClient.put<SaleOrder>(`/SaleOrders/${id}`, { ...order, id });
}

/**
 * Delete a sale order
 * @param id - Sale order ID
 */
export async function deleteSaleOrder(id: string): Promise<void> {
  await apiClient.delete<void>(`/SaleOrders/${id}`);
}

/**
 * DTO for a single refunded line in a sale order
 */
export interface SaleOrderRefundItemRequest {
  orderItemId: string;
  quantity: number;
}

/**
 * Request payload for creating a partial refund on a sale order
 * Mirrors CreateSaleOrderRefundDto on the backend.
 */
export interface CreateSaleOrderRefundRequest {
  orderId: string;
  items: SaleOrderRefundItemRequest[];
  paymentMethod: PaymentMethod;
  updateReceivables: boolean;
  createCashbookEntry: boolean;
  description: string;
  transactionDate: string;
  createdBy: string;
}

/**
 * Response payload for partial refund
 */
export interface SaleOrderRefundResponse {
  message: string;
  refundAmount: number;
}

/**
 * Create a partial refund (return items) for a completed sale order.
 * @param orderId - ID of the sale order
 * @param payload - Refund details (lines and quantities)
 */
export async function createSaleOrderRefund(
  orderId: string,
  payload: CreateSaleOrderRefundRequest,
): Promise<SaleOrderRefundResponse> {
  return apiClient.post<SaleOrderRefundResponse>(`/SaleOrders/${orderId}/refund`, payload);
}

