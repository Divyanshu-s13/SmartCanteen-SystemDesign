/**
 * Repository interfaces for Dependency Inversion Principle (DIP)
 * These interfaces define contracts for data access layer
 */

import {
  IUser,
  ICreateUserDTO,
  IMenuItem,
  ICreateMenuItemDTO,
  IUpdateMenuItemDTO,
  IOrder,
  ICreateOrderDTO,
  IOrderItem,
  IPayment,
  ICreatePaymentDTO,
  OrderStatus,
  MenuCategory
} from './index';

// Base repository interface with common CRUD operations
export interface IBaseRepository<T, CreateDTO, UpdateDTO = Partial<CreateDTO>> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// User repository interface
export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findAll(): Promise<IUser[]>;
  create(data: ICreateUserDTO): Promise<IUser>;
  update(id: string, data: Partial<ICreateUserDTO>): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;
}

// Menu repository interface
export interface IMenuRepository {
  findById(id: string): Promise<IMenuItem | null>;
  findAll(): Promise<IMenuItem[]>;
  findByCategory(category: MenuCategory): Promise<IMenuItem[]>;
  findAvailable(): Promise<IMenuItem[]>;
  create(data: ICreateMenuItemDTO): Promise<IMenuItem>;
  update(id: string, data: IUpdateMenuItemDTO): Promise<IMenuItem | null>;
  delete(id: string): Promise<boolean>;
  toggleAvailability(id: string): Promise<IMenuItem | null>;
}

// Order repository interface
export interface IOrderRepository {
  findById(id: string): Promise<IOrder | null>;
  findByIdWithItems(id: string): Promise<IOrder | null>;
  findAll(): Promise<IOrder[]>;
  findByUserId(userId: string): Promise<IOrder[]>;
  findByStatus(status: OrderStatus): Promise<IOrder[]>;
  findActiveOrders(): Promise<IOrder[]>;
  create(data: ICreateOrderDTO, totalPrice: number, tokenNumber: number): Promise<IOrder>;
  updateStatus(id: string, status: OrderStatus): Promise<IOrder | null>;
  getNextTokenNumber(): Promise<number>;
  getTodayOrders(): Promise<IOrder[]>;
  getOrderStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
  }>;
}

// Order item repository interface
export interface IOrderItemRepository {
  findByOrderId(orderId: string): Promise<IOrderItem[]>;
  create(orderId: string, menuItemId: string, quantity: number, price: number): Promise<IOrderItem>;
  createMany(orderId: string, items: { menuItemId: string; quantity: number; price: number }[]): Promise<IOrderItem[]>;
}

// Payment repository interface
export interface IPaymentRepository {
  findById(id: string): Promise<IPayment | null>;
  findByOrderId(orderId: string): Promise<IPayment | null>;
  findAll(): Promise<IPayment[]>;
  create(data: ICreatePaymentDTO): Promise<IPayment>;
  updateStatus(id: string, status: string, transactionId?: string): Promise<IPayment | null>;
}
