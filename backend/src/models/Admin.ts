/**
 * Admin class - Derived from User
 * Demonstrates Inheritance and Polymorphism
 */

import { User } from './User';
import { IUser, UserRole, OrderStatus } from '../interfaces';

export class Admin extends User {
  private _employeeId?: string;
  private _position?: string;

  constructor(data: IUser, employeeId?: string, position?: string) {
    super(data);
    this._employeeId = employeeId;
    this._position = position || 'Staff';

    // Ensure role is admin
    if (this._role !== UserRole.ADMIN) {
      throw new Error('Invalid role for Admin');
    }
  }

  // Getters for admin-specific properties
  get employeeId(): string | undefined {
    return this._employeeId;
  }

  get position(): string | undefined {
    return this._position;
  }

  // Implement abstract method - Polymorphism
  getPermissions(): string[] {
    return [
      '/api/menu',
      '/api/orders',
      '/api/payments',
      '/api/queue',
      '/api/profile',
      '/api/admin'  // Admin-only routes
    ];
  }

  // Admin-specific methods
  canManageMenu(): boolean {
    return true;
  }

  canManageOrders(): boolean {
    return true;
  }

  canUpdateOrderStatus(): boolean {
    return true;
  }

  canViewDashboard(): boolean {
    return true;
  }

  canViewAllOrders(): boolean {
    return true;
  }

  // Check if status transition is valid
  canTransitionOrderStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // Override toJSON to include admin-specific fields
  toJSON(): Omit<IUser, 'password'> & { employeeId?: string; position?: string } {
    return {
      ...super.toJSON(),
      employeeId: this._employeeId,
      position: this._position
    };
  }
}
