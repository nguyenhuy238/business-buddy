/**
 * Payment Settings Service
 * Handles payment settings API calls
 */
import { apiClient } from "./api";

/**
 * Payment settings interface matching backend PaymentSettingsDto
 */
export interface PaymentSettings {
  id: string;
  paymentMethod: string;
  bankName?: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  phoneNumber?: string;
  qrTemplate?: string;
  isDefault: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create payment settings DTO
 */
export interface CreatePaymentSettings {
  paymentMethod: string;
  bankName?: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  phoneNumber?: string;
  qrTemplate?: string;
  isDefault?: boolean;
  notes?: string;
}

/**
 * Update payment settings DTO
 */
export interface UpdatePaymentSettings {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  phoneNumber?: string;
  qrTemplate?: string;
  isDefault?: boolean;
  isActive?: boolean;
  notes?: string;
}

/**
 * Get all payment settings
 * @param paymentMethod - Optional filter by payment method
 * @returns List of payment settings
 */
export async function getPaymentSettings(paymentMethod?: string): Promise<PaymentSettings[]> {
  const params: Record<string, string> = {};
  if (paymentMethod) {
    params.paymentMethod = paymentMethod;
  }
  return apiClient.get<PaymentSettings[]>("/PaymentSettings", params);
}

/**
 * Get payment settings by ID
 * @param id - Payment settings ID
 * @returns Payment settings or null if not found
 */
export async function getPaymentSettingsById(id: string): Promise<PaymentSettings | null> {
  try {
    return await apiClient.get<PaymentSettings>(`/PaymentSettings/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get default payment settings for a payment method
 * @param paymentMethod - Payment method (Cash, BankTransfer, VietQR, Momo, etc.)
 * @returns Default payment settings or null if not found
 */
export async function getDefaultPaymentSettings(paymentMethod: string): Promise<PaymentSettings | null> {
  try {
    return await apiClient.get<PaymentSettings>(`/PaymentSettings/default/${paymentMethod}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create new payment settings
 * @param settings - Payment settings data
 * @returns Created payment settings
 */
export async function createPaymentSettings(settings: CreatePaymentSettings): Promise<PaymentSettings> {
  return apiClient.post<PaymentSettings>("/PaymentSettings", settings);
}

/**
 * Update payment settings
 * @param id - Payment settings ID
 * @param settings - Payment settings data to update
 * @returns Updated payment settings
 */
export async function updatePaymentSettings(id: string, settings: UpdatePaymentSettings): Promise<PaymentSettings> {
  return apiClient.put<PaymentSettings>(`/PaymentSettings/${id}`, settings);
}

/**
 * Delete payment settings (soft delete)
 * @param id - Payment settings ID
 */
export async function deletePaymentSettings(id: string): Promise<void> {
  await apiClient.delete<void>(`/PaymentSettings/${id}`);
}

