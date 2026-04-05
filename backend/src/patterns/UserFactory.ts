/**
 * Factory Pattern - User Factory
 * Creates user objects dynamically based on role
 * Follows Open/Closed Principle - open for extension, closed for modification
 */

import { User, Student, Admin } from '../models';
import { IUser, UserRole } from '../interfaces';

// Factory interface
interface IUserFactory {
  createUser(data: IUser): User;
}

/**
 * Concrete User Factory
 * Creates appropriate user type based on role
 */
export class UserFactory implements IUserFactory {
  /**
   * Creates a user based on role
   * @param data - User data including role
   * @returns Student or Admin instance
   */
  createUser(data: IUser): User {
    switch (data.role) {
      case UserRole.STUDENT:
        return new Student(data);
      case UserRole.ADMIN:
        return new Admin(data);
      default:
        throw new Error(`Unknown user role: ${data.role}`);
    }
  }

  /**
   * Creates a student user
   * @param data - User data
   * @param studentId - Optional student ID
   * @param department - Optional department
   */
  createStudent(data: IUser, studentId?: string, department?: string): Student {
    if (data.role !== UserRole.STUDENT) {
      data = { ...data, role: UserRole.STUDENT };
    }
    return new Student(data, studentId, department);
  }

  /**
   * Creates an admin user
   * @param data - User data
   * @param employeeId - Optional employee ID
   * @param position - Optional position
   */
  createAdmin(data: IUser, employeeId?: string, position?: string): Admin {
    if (data.role !== UserRole.ADMIN) {
      data = { ...data, role: UserRole.ADMIN };
    }
    return new Admin(data, employeeId, position);
  }
}

// Export singleton instance
export const userFactory = new UserFactory();
