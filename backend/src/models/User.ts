/**
 * Base User class demonstrating OOP Principles:
 * - Encapsulation: Private properties with getters/setters
 * - Abstraction: Abstract methods for role-specific behavior
 */

import { IUser, UserRole } from '../interfaces';

export abstract class User implements IUser {
  protected _id: string;
  protected _name: string;
  protected _email: string;
  protected _password: string;
  protected _role: UserRole;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(data: IUser) {
    this._id = data.id;
    this._name = data.name;
    this._email = data.email;
    this._password = data.password;
    this._role = data.role;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // Getters - Encapsulation
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Setters - Encapsulation with validation
  set name(value: string) {
    if (value.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this._name = value.trim();
  }

  set email(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    this._email = value.toLowerCase();
  }

  // Abstract method - Abstraction (must be implemented by derived classes)
  abstract getPermissions(): string[];

  // Common method for all users
  canAccessRoute(route: string): boolean {
    const permissions = this.getPermissions();
    return permissions.some(permission => route.startsWith(permission));
  }

  // Convert to plain object
  toJSON(): Omit<IUser, 'password'> {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      role: this._role,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    } as Omit<IUser, 'password'>;
  }

  // Static validation method
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    return { valid: true };
  }
}
