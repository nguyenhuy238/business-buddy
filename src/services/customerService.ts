/**
 * Customer Service
 * Handles customer API calls
 */
import { apiClient } from "./api";
import type { Customer } from "@/types";

/**
 * Get all customers
 * @returns Array of customers
 */
export async function getCustomers(): Promise<Customer[]> {
  return apiClient.get<Customer[]>("/Customers");
}

/**
 * Get a customer by ID
 * @param id - Customer ID
 * @returns Customer or null if not found
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    return await apiClient.get<Customer>(`/Customers/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new customer
 * @param customer - Customer data
 * @returns Created customer
 */
export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  return apiClient.post<Customer>("/Customers", customer);
}

/**
 * Update an existing customer
 * @param id - Customer ID
 * @param customer - Customer data to update
 * @returns Updated customer
 */
export async function updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
  return apiClient.put<Customer>(`/Customers/${id}`, customer);
}

/**
 * Delete a customer
 * @param id - Customer ID
 */
export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete<void>(`/Customers/${id}`);
}

