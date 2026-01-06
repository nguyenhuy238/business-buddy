/**
 * Payable Service
 * Handles payables (supplier debt) API calls
 */
import { apiClient } from "./api";
import type {
  Payable,
  PayableTransaction,
  CreatePayablePayment,
  CreatePayableAdjustment,
  PayableStatistics,
} from "@/types";

/**
 * Get all payables with optional filters
 * @param overdueOnly - Only return overdue payables
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @returns Array of payables
 */
export async function getPayables(
  overdueOnly?: boolean,
  from?: Date,
  to?: Date
): Promise<Payable[]> {
  const params: Record<string, string> = {};
  
  if (overdueOnly) {
    params.overdueOnly = "true";
  }
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<Payable[]>("/Payables", params);
}

/**
 * Get payable transactions for a specific supplier
 * @param supplierId - Supplier ID
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @returns Array of payable transactions
 */
export async function getSupplierPayableTransactions(
  supplierId: string,
  from?: Date,
  to?: Date
): Promise<PayableTransaction[]> {
  const params: Record<string, string> = {};
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<PayableTransaction[]>(
    `/Payables/supplier/${supplierId}/transactions`,
    params
  );
}

/**
 * Create a payment to pay payables
 * @param payment - Payment data
 * @returns Created transaction
 */
export async function createPayablePayment(
  payment: CreatePayablePayment
): Promise<PayableTransaction> {
  const payload = {
    ...payment,
    transactionDate: payment.transactionDate || new Date().toISOString(),
    createdBy: payment.createdBy || "System",
  };
  
  return apiClient.post<PayableTransaction>("/Payables/payment", payload);
}

/**
 * Create an adjustment to payables
 * @param adjustment - Adjustment data
 * @returns Created transaction
 */
export async function createPayableAdjustment(
  adjustment: CreatePayableAdjustment
): Promise<PayableTransaction> {
  const payload = {
    ...adjustment,
    transactionDate: adjustment.transactionDate || new Date().toISOString(),
    createdBy: adjustment.createdBy || "System",
  };
  
  return apiClient.post<PayableTransaction>("/Payables/adjustment", payload);
}

/**
 * Get payable statistics
 * @returns Payable statistics
 */
export async function getPayableStatistics(): Promise<PayableStatistics> {
  return apiClient.get<PayableStatistics>("/Payables/statistics");
}

