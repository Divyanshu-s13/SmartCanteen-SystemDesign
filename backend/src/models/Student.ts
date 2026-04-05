/**
 * Student class - Derived from User
 * Demonstrates Inheritance and Polymorphism
 */

import { User } from './User';
import { IUser, UserRole } from '../interfaces';

export class Student extends User {
  private _studentId?: string;
  private _department?: string;

  constructor(data: IUser, studentId?: string, department?: string) {
    super(data);
    this._studentId = studentId;
    this._department = department;

    // Ensure role is student
    if (this._role !== UserRole.STUDENT) {
      throw new Error('Invalid role for Student');
    }
  }

  // Getters for student-specific properties
  get studentId(): string | undefined {
    return this._studentId;
  }

  get department(): string | undefined {
    return this._department;
  }

  // Implement abstract method - Polymorphism
  getPermissions(): string[] {
    return [
      '/api/menu',
      '/api/orders',
      '/api/payments',
      '/api/queue',
      '/api/profile'
    ];
  }

  // Student-specific methods
  canPlaceOrder(): boolean {
    return true;
  }

  canViewOwnOrders(): boolean {
    return true;
  }

  canCancelOrder(orderUserId: string): boolean {
    return orderUserId === this._id;
  }

  // Override toJSON to include student-specific fields
  toJSON(): object {
    return {
      ...super.toJSON(),
      studentId: this._studentId,
      department: this._department
    };
  }
}
