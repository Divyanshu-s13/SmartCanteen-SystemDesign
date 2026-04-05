/**
 * Utility functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with Tailwind merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price in Indian Rupees
export function formatPrice(price: number): string {
  return `₹${price.toFixed(2)}`;
}

// Format date
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format time
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format datetime
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Get status label
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
    success: 'Success',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

// Get category label
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    snacks: 'Snacks',
    drinks: 'Drinks',
    meals: 'Meals',
  };
  return labels[category] || category;
}

// Get payment method label
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    upi: 'UPI',
    card: 'Card',
    wallet: 'Wallet',
  };
  return labels[method] || method;
}

// Local storage helpers
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// Token management
export const TOKEN_KEY = 'smartcanteen_token';
export const USER_KEY = 'smartcanteen_user';

export const getToken = (): string | null => storage.get<string>(TOKEN_KEY);
export const setToken = (token: string): void => storage.set(TOKEN_KEY, token);
export const removeToken = (): void => storage.remove(TOKEN_KEY);

export const getStoredUser = () => storage.get(USER_KEY);
export const setStoredUser = (user: any): void => storage.set(USER_KEY, user);
export const removeStoredUser = (): void => storage.remove(USER_KEY);
