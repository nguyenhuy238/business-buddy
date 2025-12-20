/**
 * Product Service
 * Handles all product-related API calls
 */
import { apiClient } from "./api";
import type { Product, CreateProduct, UpdateProduct } from "@/types";

/**
 * Get all products
 * @param includeInactive - Whether to include inactive products
 * @returns Array of products
 */
export async function getProducts(includeInactive = false): Promise<Product[]> {
  return apiClient.get<Product[]>("/products", { includeInactive });
}

/**
 * Get a product by ID
 * @param id - Product ID
 * @returns Product or null if not found
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await apiClient.get<Product>(`/products/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get a product by code
 * @param code - Product code
 * @returns Product or null if not found
 */
export async function getProductByCode(code: string): Promise<Product | null> {
  try {
    return await apiClient.get<Product>(`/products/code/${encodeURIComponent(code)}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get a product by barcode
 * @param barcode - Product barcode
 * @returns Product or null if not found
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    return await apiClient.get<Product>(`/products/barcode/${encodeURIComponent(barcode)}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new product
 * @param product - Product data to create
 * @returns Created product
 */
export async function createProduct(product: CreateProduct): Promise<Product> {
  return apiClient.post<Product>("/products", product);
}

/**
 * Update an existing product
 * @param id - Product ID
 * @param product - Product data to update
 * @returns Updated product
 */
export async function updateProduct(id: string, product: UpdateProduct): Promise<Product> {
  return apiClient.put<Product>(`/products/${id}`, product);
}

/**
 * Delete a product
 * @param id - Product ID
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete<void>(`/products/${id}`);
}

