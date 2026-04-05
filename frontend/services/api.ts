/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import { getToken } from '@/lib/utils';
import type {
  ApiResponse,
  AuthResponse,
  User,
  MenuItem,
  Order,
  Payment,
  DashboardStats,
  CreateOrderRequest,
  ProcessPaymentRequest,
  PaymentMethodInfo,
  QueueItem,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// HTTP client with authentication
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

// Auth API
export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    fetchWithAuth<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchWithAuth<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => fetchWithAuth<User>('/auth/profile'),

  updateProfile: (data: { name?: string; email?: string }) =>
    fetchWithAuth<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchWithAuth('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  verifyToken: () => fetchWithAuth<User>('/auth/verify'),
};

// Menu API
export const menuApi = {
  getAll: () => fetchWithAuth<MenuItem[]>('/menu'),

  getGrouped: () => fetchWithAuth<Record<string, MenuItem[]>>('/menu/grouped'),

  getById: (id: string) => fetchWithAuth<MenuItem>(`/menu/${id}`),

  getByCategory: (category: string) =>
    fetchWithAuth<MenuItem[]>(`/menu/category/${category}`),

  search: (query: string) => fetchWithAuth<MenuItem[]>(`/menu/search?q=${query}`),

  // Admin methods
  create: (data: Partial<MenuItem>) =>
    fetchWithAuth<MenuItem>('/admin/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<MenuItem>) =>
    fetchWithAuth<MenuItem>(`/admin/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/admin/menu/${id}`, {
      method: 'DELETE',
    }),

  toggleAvailability: (id: string) =>
    fetchWithAuth<MenuItem>(`/admin/menu/${id}/toggle`, {
      method: 'PATCH',
    }),
};

// Order API
export const orderApi = {
  create: (data: CreateOrderRequest) =>
    fetchWithAuth<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyOrders: () => fetchWithAuth<Order[]>('/orders'),

  getById: (id: string) => fetchWithAuth<Order>(`/orders/${id}`),

  getQueuePosition: (id: string) =>
    fetchWithAuth<QueueItem & { position: number }>(`/orders/${id}/queue-position`),

  cancel: (id: string) =>
    fetchWithAuth<Order>(`/orders/${id}`, {
      method: 'DELETE',
    }),

  // Admin methods
  getAll: (status?: string) =>
    fetchWithAuth<Order[]>(`/admin/orders${status ? `?status=${status}` : ''}`),

  getActive: () => fetchWithAuth<Order[]>('/admin/orders/active'),

  updateStatus: (id: string, status: string) =>
    fetchWithAuth<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// Payment API
export const paymentApi = {
  getMethods: () => fetchWithAuth<PaymentMethodInfo[]>('/payments/methods'),

  process: (data: ProcessPaymentRequest) =>
    fetchWithAuth<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) => fetchWithAuth<Payment>(`/payments/${id}`),

  getByOrderId: (orderId: string) =>
    fetchWithAuth<Payment>(`/payments/order/${orderId}`),

  // Admin methods
  getAll: () => fetchWithAuth<Payment[]>('/admin/payments'),

  getStats: () =>
    fetchWithAuth<{
      totalPayments: number;
      successfulPayments: number;
      failedPayments: number;
      totalAmount: number;
      byMethod: Record<string, number>;
    }>('/admin/payments/stats'),

  refund: (orderId: string) =>
    fetchWithAuth<Payment>(`/admin/payments/${orderId}/refund`, {
      method: 'POST',
    }),
};

// Queue API
export const queueApi = {
  get: () =>
    fetchWithAuth<{
      queue: QueueItem[];
      readyOrders: QueueItem[];
      preparingOrders: QueueItem[];
      totalInQueue: number;
    }>('/queue'),
};

// Admin Dashboard API
export const adminApi = {
  getDashboard: () => fetchWithAuth<DashboardStats>('/admin/dashboard'),
};
