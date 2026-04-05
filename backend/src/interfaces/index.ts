/**
 * Core interfaces for the SmartCanteen application
 * Following Interface Segregation Principle (ISP)
 */

// User role enumeration
export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

// Order status enumeration
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Payment status enumeration
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Payment method enumeration
export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  WALLET = 'wallet'
}

// Menu category enumeration
export enum MenuCategory {
  SNACKS = 'snacks',
  DRINKS = 'drinks',
  MEALS = 'meals'
}

// Base user interface
export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// User creation DTO
export interface ICreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// User login DTO
export interface ILoginDTO {
  email: string;
  password: string;
}

// Menu item interface
export interface IMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create menu item DTO
export interface ICreateMenuItemDTO {
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  isAvailable?: boolean;
}

// Update menu item DTO
export interface IUpdateMenuItemDTO {
  name?: string;
  description?: string;
  price?: number;
  category?: MenuCategory;
  imageUrl?: string;
  isAvailable?: boolean;
}

// Order interface
export interface IOrder {
  id: string;
  userId: string;
  totalPrice: number;
  status: OrderStatus;
  tokenNumber: number;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Order item interface
export interface IOrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: IMenuItem;
  quantity: number;
  price: number;
}

// Create order DTO
export interface ICreateOrderDTO {
  userId: string;
  items: {
    menuItemId: string;
    quantity: number;
  }[];
}

// Payment interface
export interface IPayment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create payment DTO
export interface ICreatePaymentDTO {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

// JWT Payload interface
export interface IJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// API Response interface
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Pagination interface
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated response interface
export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: IPagination;
}

// Queue item for real-time updates
export interface IQueueItem {
  tokenNumber: number;
  orderId: string;
  status: OrderStatus;
  estimatedTime?: number;
}

// Dashboard statistics
export interface IDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}
