/**
 * Frontend Type Definitions
 * Mirrors backend interfaces for type safety
 */

// User role enumeration
export type UserRole = 'student' | 'admin';

// Order status enumeration
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// Payment status enumeration
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

// Payment method enumeration
export type PaymentMethod = 'upi' | 'card' | 'wallet';

// Menu category enumeration
export type MenuCategory = 'snacks' | 'drinks' | 'meals';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Auth response
export interface AuthResponse {
  user: User;
  token: string;
}

// Menu item interface
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cart item interface
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// Order item interface
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  price: number;
}

// Order interface
export interface Order {
  id: string;
  userId: string;
  totalPrice: number;
  status: OrderStatus;
  tokenNumber: number;
  items: OrderItem[];
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
}

// Payment interface
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Queue item interface
export interface QueueItem {
  tokenNumber: number;
  orderId: string;
  status: OrderStatus;
  estimatedTime?: number;
}

// Dashboard statistics
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Payment method info
export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  description: string;
}

// Create order request
export interface CreateOrderRequest {
  items: {
    menuItemId: string;
    quantity: number;
  }[];
}

// Process payment request
export interface ProcessPaymentRequest {
  orderId: string;
  method: PaymentMethod;
  paymentDetails: Record<string, any>;
}

// WebSocket events
export interface SocketEvents {
  'queue:update': (queueItem: QueueItem) => void;
  'queue:full': (queue: QueueItem[]) => void;
  'order:status': (queueItem: QueueItem) => void;
  'order:ready': (data: { tokenNumber: number; message: string }) => void;
  'admin:new-order': (order: Order) => void;
  'admin:order-update': (queueItem: QueueItem) => void;
  authenticated: (data: { userId: string; role: UserRole }) => void;
  auth_error: (data: { message: string }) => void;
}
