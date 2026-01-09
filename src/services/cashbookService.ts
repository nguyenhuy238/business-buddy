/**
 * Cashbook Service
 * Handles cashbook entry API calls
 */
import { apiClient } from "./api";
import type { CashbookEntry } from "@/types";

/**
 * Get all cashbook entries with optional date filters
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @returns Array of cashbook entries
 */
export async function getCashbookEntries(
  from?: Date,
  to?: Date
): Promise<CashbookEntry[]> {
  const params: Record<string, string> = {};
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<CashbookEntry[]>("/Cashbook", params);
}

/**
 * Get a cashbook entry by ID
 * @param id - Cashbook entry ID
 * @returns Cashbook entry or null if not found
 */
export async function getCashbookEntryById(id: string): Promise<CashbookEntry | null> {
  try {
    return await apiClient.get<CashbookEntry>(`/Cashbook/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new cashbook entry
 * @param entry - Cashbook entry data
 * @returns Created cashbook entry
 */
export async function createCashbookEntry(entry: Partial<CashbookEntry>): Promise<CashbookEntry> {
  return apiClient.post<CashbookEntry>("/Cashbook", entry);
}

/**
 * Update an existing cashbook entry
 * @param id - Cashbook entry ID
 * @param entry - Cashbook entry data to update
 */
export async function updateCashbookEntry(id: string, entry: Partial<CashbookEntry>): Promise<void> {
  await apiClient.put<void>(`/Cashbook/${id}`, { ...entry, id });
}

/**
 * Delete a cashbook entry
 * @param id - Cashbook entry ID
 */
export async function deleteCashbookEntry(id: string): Promise<void> {
  await apiClient.delete<void>(`/Cashbook/${id}`);
}

/**
 * Get cashbook statistics
 * @param from - Optional start date filter
 * @param to - Optional end date filter
 * @returns Cashbook statistics
 */
export interface CashbookStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalTransactions: number;
  todayIncome: number;
  todayExpense: number;
  todayBalance: number;
  todayTransactions: number;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
}

export async function getCashbookStatistics(
  from?: Date,
  to?: Date
): Promise<CashbookStats> {
  const params: Record<string, string> = {};
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<CashbookStats>("/Cashbook/statistics", params);
}

