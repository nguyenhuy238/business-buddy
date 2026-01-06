/**
 * Receivable Service
 * Handles receivables (customer debt) API calls
 */
import { apiClient } from "./api";
import type {
  Receivable,
  ReceivableTransaction,
  CreateReceivablePayment,
  CreateReceivableAdjustment,
  ReceivableStatistics,
} from "@/types";

/**
 * Get all receivables with optional filters
 * @param overdueOnly - Only return overdue receivables
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @returns Array of receivables
 */
export async function getReceivables(
  overdueOnly?: boolean,
  from?: Date,
  to?: Date
): Promise<Receivable[]> {
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
  
  return apiClient.get<Receivable[]>("/Receivables", params);
}

/**
 * Get receivable transactions for a specific customer
 * @param customerId - Customer ID
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @returns Array of receivable transactions
 */
export async function getCustomerReceivableTransactions(
  customerId: string,
  from?: Date,
  to?: Date
): Promise<ReceivableTransaction[]> {
  const params: Record<string, string> = {};
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<ReceivableTransaction[]>(
    `/Receivables/customer/${customerId}/transactions`,
    params
  );
}

/**
 * Create a payment to collect receivables
 * @param payment - Payment data
 * @returns Created transaction
 */
export async function createReceivablePayment(
  payment: CreateReceivablePayment
): Promise<ReceivableTransaction> {
  const payload = {
    ...payment,
    transactionDate: payment.transactionDate || new Date().toISOString(),
    createdBy: payment.createdBy || "System",
  };
  
  return apiClient.post<ReceivableTransaction>("/Receivables/payment", payload);
}

/**
 * Create an adjustment to receivables
 * @param adjustment - Adjustment data
 * @returns Created transaction
 */
export async function createReceivableAdjustment(
  adjustment: CreateReceivableAdjustment
): Promise<ReceivableTransaction> {
  const payload = {
    ...adjustment,
    transactionDate: adjustment.transactionDate || new Date().toISOString(),
    createdBy: adjustment.createdBy || "System",
  };
  
  return apiClient.post<ReceivableTransaction>("/Receivables/adjustment", payload);
}

/**
 * Get receivable statistics
 * @returns Receivable statistics
 */
export async function getReceivableStatistics(): Promise<ReceivableStatistics> {
  return apiClient.get<ReceivableStatistics>("/Receivables/statistics");
}

