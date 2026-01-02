/**
 * API Client Configuration
 * 
 * Axios instance with:
 * - Base URL: http://localhost:8000/api
 * - JWT Auth Interceptor (auto-attach token)
 * - Token Refresh Logic (refresh on 401)
 */

import axios from 'axios';

// Storage keys
const ACCESS_TOKEN_KEY = 'lider_garant_access_token';
const REFRESH_TOKEN_KEY = 'lider_garant_refresh_token';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  phone: string;
  role: 'client' | 'agent' | 'partner' | 'admin';
  first_name: string;
  last_name: string;
  is_active: boolean;
  accreditation_status?: 'none' | 'pending' | 'approved' | 'rejected';
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
  role: 'client' | 'agent';
  first_name?: string;
  last_name?: string;
  referral_id?: number | null;  // Partner ID who invited this user
}

// Token management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (tokens: AuthTokens): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};

// Request queue for handling concurrent requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: Response) => void;
  reject: (error: Error) => void;
  request: Request;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach(async (prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Retry the request with new token
      try {
        const response = await fetchWithAuth(prom.request.clone());
        prom.resolve(response);
      } catch (err) {
        prom.reject(err as Error);
      }
    }
  });
  failedQueue = [];
};

// Refresh token function
async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const tokens: AuthTokens = {
      access: data.access,
      refresh: data.refresh || refreshToken, // Some APIs don't return new refresh token
    };

    tokenStorage.setTokens(tokens);
    return tokens;
  } catch (error) {
    tokenStorage.clearTokens();
    return null;
  }
}

// Main fetch wrapper with auth
async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const accessToken = tokenStorage.getAccessToken();

  const headers = new Headers(init?.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const request = new Request(input, {
    ...init,
    headers,
  });

  let response = await fetch(request.clone());

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && accessToken) {
    if (isRefreshing) {
      // Wait for the refresh to complete
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, request: request.clone() });
      });
    }

    isRefreshing = true;

    try {
      const newTokens = await refreshAccessToken();

      if (newTokens) {
        // Retry original request with new token
        const newHeaders = new Headers(init?.headers);
        newHeaders.set('Authorization', `Bearer ${newTokens.access}`);
        if (!(init?.body instanceof FormData) && !newHeaders.has('Content-Type')) {
          newHeaders.set('Content-Type', 'application/json');
        }

        response = await fetch(input, {
          ...init,
          headers: newHeaders,
        });

        processQueue(null);
      } else {
        // Refresh failed - let the calling code handle the 401
        // Do NOT redirect here, AuthContext will handle navigation
        processQueue(new Error('Authentication failed'));
      }
    } catch (error) {
      processQueue(error as Error);
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

// API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Debug logging
      console.error("[API ERROR] Status:", response.status);
      console.error("[API ERROR] URL:", response.url);
      console.error("[API ERROR] Response:", JSON.stringify(errorData, null, 2));

      const error: ApiError = {
        message: errorData.detail || errorData.error || errorData.non_field_errors?.[0] || 'An error occurred',
        status: response.status,
        errors: errorData,
      };
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetchWithAuth(url, { method: 'GET' });
    return this.handleResponse<T>(response);
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    return this.handleResponse<T>(response);
  }

  // File upload
  async upload<T>(endpoint: string, file: File, fieldName: string = 'file', additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post<T>(endpoint, formData);
  }

  // Upload with progress using axios (to support progress tracking)
  async uploadWithProgress<T>(
    endpoint: string,
    data: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let accessToken = tokenStorage.getAccessToken();

    const getHeaders = (token: string | null) => {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
    };

    try {
      const response = await axios.post(url, data, {
        headers: getHeaders(accessToken),
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error: any) {
      // Handle 401 Unauthorized - try to refresh token
      if (error.response?.status === 401) {
        let newTokens = null;
        try {
          newTokens = await refreshAccessToken();
        } catch (refreshError) {
          // Refresh failed, will fall through to throw original 401
        }

        if (newTokens) {
          // Retry request with new token
          try {
            const response = await axios.post(url, data, {
              headers: getHeaders(newTokens.access),
              onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                  const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  onProgress(progress);
                }
              },
            });
            return response.data;
          } catch (retryError: any) {
            // If retry fails, throw THIS error, not the original 401
            const status = retryError.response?.status || 500;
            const message = retryError.response?.data?.detail || retryError.message || 'Upload failed';
            const errors = retryError.response?.data;
            throw { message, status, errors } as ApiError;
          }
        }
      }

      const status = error.response?.status || 500;
      const message = error.response?.data?.detail || error.message || 'Upload failed';
      const errors = error.response?.data;
      throw { message, status, errors } as ApiError;
    }
  }
}

// Export singleton instance
export const api = new ApiClient();

// Auth-specific functions (public endpoints)
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        message: error.detail || 'Login failed',
        status: response.status,
        errors: error,
      } as ApiError;
    }

    const data = await response.json();
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh });
    return data;
  },

  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        message: error.detail || 'Registration failed',
        status: response.status,
        errors: error,
      } as ApiError;
    }

    const data = await response.json();
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh });
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();

    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken });
      } catch {
        // Ignore logout errors
      }
    }

    tokenStorage.clearTokens();
  },

  getMe: async (): Promise<User> => {
    return api.get<User>('/auth/me/');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return api.patch<User>('/auth/me/', data);
  },

  changePassword: async (oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> => {
    await api.post('/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  },
};

export default api;
