/**
 * API Client for making HTTP requests to the backend
 * Handles base URL configuration and common request/response logic
 */

// API Base URL - can be configured via VITE_API_BASE_URL environment variable
// Default: IIS Express (https://localhost:44384/api)
// Alternative: dotnet run (http://localhost:5000/api or https://localhost:5001/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:44384/api";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * Base API client with common HTTP methods
 */
export const apiClient = {
  /**
   * Performs a GET request
   */
  async get<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const urlWithParams = params
      ? `${url}?${new URLSearchParams(params as Record<string, string>).toString()}`
      : url;
    
    const response = await fetch(`${API_BASE_URL}${urlWithParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        await response.text().catch(() => undefined)
      );
    }

    return response.json();
  },

  /**
   * Performs a POST request
   */
  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        await response.text().catch(() => undefined)
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  },

  /**
   * Performs a POST request with FormData (for file uploads).
   * Note: Do NOT set Content-Type header for multipart/form-data - the browser will set the boundary.
   */
  async postForm<T>(url: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        await response.text().catch(() => undefined)
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  },

  /**
   * Performs a PUT request
   */
  async put<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        await response.text().catch(() => undefined)
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  },

  /**
   * Performs a DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        await response.text().catch(() => undefined)
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  },
};

