/**
 * Supplier Service
 * Handles supplier API calls
 */
import { apiClient } from "./api";
import type { Supplier } from "@/types";

/**
 * Get all suppliers
 * @returns Array of suppliers
 */
export async function getSuppliers(): Promise<Supplier[]> {
  return apiClient.get<Supplier[]>("/Suppliers");
}

/**
 * Get a supplier by ID
 * @param id - Supplier ID
 * @returns Supplier or null if not found
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    return await apiClient.get<Supplier>(`/Suppliers/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new supplier
 * @param supplier - Supplier data
 * @returns Created supplier
 */
export async function createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  return apiClient.post<Supplier>("/Suppliers", supplier);
}

/**
 * Update an existing supplier
 * @param id - Supplier ID
 * @param supplier - Supplier data to update
 * @returns Updated supplier
 */
export async function updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
  return apiClient.put<Supplier>(`/Suppliers/${id}`, supplier);
}

/**
 * Delete a supplier
 * @param id - Supplier ID
 */
export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete<void>(`/Suppliers/${id}`);
}

