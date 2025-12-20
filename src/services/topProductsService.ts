/**
 * Top Products Service
 * Handles top products API calls
 */
import { apiClient } from "./api";

/**
 * Top product interface from API
 */
export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

/**
 * Get top products
 * @param from - Optional start date
 * @param to - Optional end date
 * @param limit - Number of products to return (default: 10)
 * @returns Array of top products
 */
export async function getTopProducts(
  from?: Date,
  to?: Date,
  limit = 10
): Promise<TopProduct[]> {
  const params: Record<string, string | number> = { limit };
  
  if (from) {
    params.from = from.toISOString();
  }
  
  if (to) {
    params.to = to.toISOString();
  }
  
  return apiClient.get<TopProduct[]>("/TopProducts", params);
}

