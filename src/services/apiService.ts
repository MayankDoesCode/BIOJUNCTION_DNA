/**
 * Secure API Communication Service
 * Prepared for future FastAPI backend integration (FastAPI + JWT + Pydantic endpoints).
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

class ApiService {
  private token: string | null = null;

  public setAuthToken(token: string | null): void {
    this.token = token;
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  private async request<T>(endpoint: string, init: RequestInit): Promise<ApiResponse<T>> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        statusCode: 0,
        error: 'Terminal is currently OFFLINE. Operations cached locally.',
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...init,
        headers: {
          ...this.getHeaders(),
          ...init.headers,
        },
      });

      if (!response.ok) {
        return {
          statusCode: response.status,
          error: `API Request failed with HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        statusCode: response.status,
        data,
      };
    } catch (err) {
      return {
        statusCode: 500,
        error: err instanceof Error ? err.message : 'Unknown network error occurred',
      };
    }
  }
}

export const apiService = new ApiService();
