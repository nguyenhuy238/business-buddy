/**
 * Purchase Order Service
 * Handles purchase order API calls
 */
import { apiClient } from "./api";
import type { PaymentMethod } from "@/types";

/**
 * Purchase order status enum
 */
export type PurchaseOrderStatus = "Draft" | "Ordered" | "Received" | "PartialReceived" | "Cancelled";

/**
 * Purchase order interface
 */
export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  discountType: "Percent" | "Amount";
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Purchase order item interface
 */
export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  unitId: string;
  unitName: string;
  unitPrice: number;
  discount: number;
  discountType: "Percent" | "Amount";
  total: number;
}

/**
 * Purchase orders response with pagination
 */
export interface PurchaseOrdersResponse {
  total: number;
  items: PurchaseOrder[];
}

/**
 * Create purchase order DTO
 */
export interface CreatePurchaseOrder {
  supplierId: string;
  items: CreatePurchaseOrderItem[];
  discount?: number;
  discountType?: "Percent" | "Amount";
  paymentMethod?: PaymentMethod;
  status?: PurchaseOrderStatus;
  paidAmount?: number;
  expectedDeliveryDate?: string;
  notes?: string;
  createdBy?: string;
}

/**
 * Create purchase order item DTO
 */
export interface CreatePurchaseOrderItem {
  productId: string;
  quantity: number;
  unitId: string;
  unitPrice: number;
  discount?: number;
  discountType?: "Percent" | "Amount";
}

/**
 * Update purchase order DTO
 */
export interface UpdatePurchaseOrder {
  supplierId?: string;
  items?: CreatePurchaseOrderItem[];
  discount?: number;
  discountType?: "Percent" | "Amount";
  paymentMethod?: PaymentMethod;
  status?: PurchaseOrderStatus;
  paidAmount?: number;
  expectedDeliveryDate?: string;
  notes?: string;
}

/**
 * Receive goods DTO
 */
export interface ReceiveGoods {
  warehouseId: string;
  items: ReceiveGoodsItem[];
  receivedDate?: string;
  notes?: string;
  createdBy?: string;
}

/**
 * Receive goods item DTO
 */
export interface ReceiveGoodsItem {
  orderItemId: string;
  receivedQuantity: number;
  expiryDate?: string;
}

/**
 * Create payment DTO
 */
export interface CreatePurchaseOrderPayment {
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
  transactionDate?: string;
  createdBy?: string;
}

/**
 * Get all purchase orders with optional filters
 * @param supplierId - Optional supplier ID filter
 * @param status - Optional status filter
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 50)
 * @returns Purchase orders with pagination info
 */
export async function getPurchaseOrders(
  supplierId?: string,
  status?: PurchaseOrderStatus,
  from?: Date,
  to?: Date,
  page = 1,
  pageSize = 50
): Promise<PurchaseOrdersResponse> {
  const params: Record<string, string | number> = { page, pageSize };
  
  if (supplierId) {
    params.supplierId = supplierId;
  }
  
  if (status) {
    params.status = status;
  }
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<PurchaseOrdersResponse>("/PurchaseOrders", params);
}

/**
 * Get a purchase order by ID
 * @param id - Purchase order ID
 * @returns Purchase order or null if not found
 */
export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  try {
    return await apiClient.get<PurchaseOrder>(`/PurchaseOrders/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new purchase order
 * @param order - Purchase order data
 * @returns Created purchase order
 */
export async function createPurchaseOrder(order: CreatePurchaseOrder): Promise<PurchaseOrder> {
  return apiClient.post<PurchaseOrder>("/PurchaseOrders", order);
}

/**
 * Update an existing purchase order
 * @param id - Purchase order ID
 * @param order - Purchase order data to update
 * @returns Updated purchase order
 */
export async function updatePurchaseOrder(id: string, order: UpdatePurchaseOrder): Promise<PurchaseOrder> {
  return apiClient.put<PurchaseOrder>(`/PurchaseOrders/${id}`, order);
}

/**
 * Delete a purchase order
 * @param id - Purchase order ID
 */
export async function deletePurchaseOrder(id: string): Promise<void> {
  await apiClient.delete<void>(`/PurchaseOrders/${id}`);
}

/**
 * Receive goods from purchase order
 * @param id - Purchase order ID
 * @param receiveGoods - Receive goods data
 * @returns Updated purchase order
 */
export async function receiveGoods(id: string, receiveGoods: ReceiveGoods): Promise<PurchaseOrder> {
  return apiClient.post<PurchaseOrder>(`/PurchaseOrders/${id}/receive`, receiveGoods);
}

/**
 * Create payment for purchase order
 * @param id - Purchase order ID
 * @param payment - Payment data
 * @returns Updated purchase order
 */
export async function createPayment(id: string, payment: CreatePurchaseOrderPayment): Promise<PurchaseOrder> {
  return apiClient.post<PurchaseOrder>(`/PurchaseOrders/${id}/payment`, payment);
}

