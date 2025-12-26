/**
 * Unit of Measure Service
 * Handles all unit of measure-related API calls
 */
import { apiClient } from "./api";
import type { UnitOfMeasure } from "@/types";

/**
 * Get all units of measure
 * @param includeInactive - Whether to include inactive units
 * @returns Array of units of measure
 */
export async function getUnitOfMeasures(includeInactive = false): Promise<UnitOfMeasure[]> {
  return apiClient.get<UnitOfMeasure[]>("/UnitOfMeasures", { includeInactive });
}

/**
 * Get a unit of measure by ID
 * @param id - Unit of measure ID
 * @returns Unit of measure or null if not found
 */
export async function getUnitOfMeasureById(id: string): Promise<UnitOfMeasure | null> {
  try {
    return await apiClient.get<UnitOfMeasure>(`/UnitOfMeasures/${id}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new unit of measure
 * @param unit - Unit of measure data to create
 * @returns Created unit of measure
 */
export async function createUnitOfMeasure(unit: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
  return apiClient.post<UnitOfMeasure>("/UnitOfMeasures", unit);
}

/**
 * Update an existing unit of measure
 * @param id - Unit of measure ID
 * @param unit - Unit of measure data to update
 * @returns Updated unit of measure
 */
export async function updateUnitOfMeasure(id: string, unit: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
  return apiClient.put<UnitOfMeasure>(`/UnitOfMeasures/${id}`, unit);
}

/**
 * Delete a unit of measure
 * @param id - Unit of measure ID
 */
export async function deleteUnitOfMeasure(id: string): Promise<void> {
  await apiClient.delete<void>(`/UnitOfMeasures/${id}`);
}

