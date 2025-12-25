/**
 * Category Service
 * Handles all category-related API calls
 */
import { apiClient } from "./api";
import type { Category } from "@/types";

/**
 * Get all categories
 * @param includeInactive - Whether to include inactive categories
 * @returns Array of categories
 */
export async function getCategories(includeInactive = false): Promise<Category[]> {
  return apiClient.get<Category[]>("/Categories", { includeInactive });
}

/**
 * Get a category by ID
 * @param id - Category ID
 * @returns Category or null if not found
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    return await apiClient.get<Category>(`/Categories/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new category
 * @param category - Category data to create
 * @returns Created category
 */
export async function createCategory(category: Partial<Category>): Promise<Category> {
  return apiClient.post<Category>("/Categories", category);
}

/**
 * Update an existing category
 * @param id - Category ID
 * @param category - Category data to update
 * @returns Updated category
 */
export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  return apiClient.put<Category>(`/Categories/${id}`, category);
}

/**
 * Delete a category
 * @param id - Category ID
 */
export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete<void>(`/Categories/${id}`);
}

