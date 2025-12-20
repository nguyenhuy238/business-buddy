/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */
import { apiClient } from "./api";
import type { DashboardStats, RevenueByCategory, RevenueByTime } from "@/types";

/**
 * Get dashboard statistics
 * @returns Dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/dashboard/stats");
}

/**
 * Get revenue by category
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of revenue by category
 */
export async function getRevenueByCategory(
  startDate?: Date,
  endDate?: Date
): Promise<RevenueByCategory[]> {
  const params: Record<string, string> = {};
  
  if (startDate) {
    params.startDate = startDate.toISOString();
  }
  
  if (endDate) {
    params.endDate = endDate.toISOString();
  }
  
  return apiClient.get<RevenueByCategory[]>("/dashboard/revenue-by-category", params);
}

/**
 * Get revenue by time period
 * @param days - Number of days to get data for (default: 30)
 * @returns Array of revenue by time
 */
export async function getRevenueByTime(days = 30): Promise<RevenueByTime[]> {
  return apiClient.get<RevenueByTime[]>("/dashboard/revenue-by-time", { days });
}

