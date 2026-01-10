/**
 * Return Order Service
 * Handles return order API calls
 */
import { apiClient } from "./api";
import type { PaymentMethod } from "@/types";

/**
 * Return order status enum
 */
export type ReturnOrderStatus = "Draft" | "Completed" | "Cancelled";

/**
 * Return order interface
 */
export interface ReturnOrder {
  id: string;
  code: string;
  saleOrderId: string;
  saleOrderCode: string;
  customerId?: string;
  customerName?: string;
  status: ReturnOrderStatus;
  items: ReturnOrderItem[];
  subtotal: number;
  total: number;
  refundMethod: PaymentMethod;
  refundAmount: number;
  reason: string;
  notes?: string;
  createdBy: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Return order item interface
 */
export interface ReturnOrderItem {
  id: string;
  saleOrderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitId: string;
  unitName: string;
  unitPrice: number;
  total: number;
  notes?: string;
}

/**
 * Return orders response with pagination
 */
export interface ReturnOrdersResponse {
  total: number;
  items: ReturnOrder[];
}

/**
 * Create return order item request
 */
export interface CreateReturnOrderItemRequest {
  saleOrderItemId: string;
  quantity: number;
  notes?: string;
}

/**
 * Create return order request
 */
export interface CreateReturnOrderRequest {
  saleOrderId: string;
  items: CreateReturnOrderItemRequest[];
  refundMethod: PaymentMethod;
  reason: string;
  notes?: string;
  updateReceivables?: boolean;
  createCashbookEntry?: boolean;
  createdBy?: string;
}

/**
 * Get all return orders with optional filters
 * @param saleOrderId - Optional sale order ID filter
 * @param customerId - Optional customer ID filter
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 50)
 * @returns Return orders with pagination info
 */
export async function getReturnOrders(
  saleOrderId?: string,
  customerId?: string,
  from?: Date,
  to?: Date,
  page = 1,
  pageSize = 50
): Promise<ReturnOrdersResponse> {
  const params: Record<string, string | number> = { page, pageSize };

  if (saleOrderId) {
    params.saleOrderId = saleOrderId;
  }

  if (customerId) {
    params.customerId = customerId;
  }

  if (from) {
    params.from = from.toISOString();
  }

  if (to) {
    params.to = to.toISOString();
  }

  return apiClient.get<ReturnOrdersResponse>("/ReturnOrders", params);
}

/**
 * Get a return order by ID
 * @param id - Return order ID
 * @returns Return order or null if not found
 */
export async function getReturnOrderById(id: string): Promise<ReturnOrder | null> {
  try {
    return await apiClient.get<ReturnOrder>(`/ReturnOrders/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new return order
 * @param order - Return order data
 * @returns Created return order
 */
export async function createReturnOrder(order: CreateReturnOrderRequest): Promise<ReturnOrder> {
  return apiClient.post<ReturnOrder>("/ReturnOrders", order);
}

/**
 * Delete a return order
 * @param id - Return order ID
 */
export async function deleteReturnOrder(id: string): Promise<void> {
  await apiClient.delete<void>(`/ReturnOrders/${id}`);
}

