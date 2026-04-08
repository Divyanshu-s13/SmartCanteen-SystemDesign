/**
 * User Repository
 * Data access layer for User entity
 * Implements IUserRepository interface
 */

import { Types } from 'mongoose';
import { UserDocumentModel, UserDoc } from '../db/models';
import { IUser, ICreateUserDTO, UserRole } from '../interfaces';
import { IUserRepository } from '../interfaces/repositories';

export class UserRepository implements IUserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const user = await UserDocumentModel.findById(id).lean<UserDoc | null>();
    return user ? this.mapToUser(user) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await UserDocumentModel.findOne({ email: email.toLowerCase() }).lean<UserDoc | null>();
    return user ? this.mapToUser(user) : null;
  }

  /**
   * Find all users
   */
  async findAll(): Promise<IUser[]> {
    const users = await UserDocumentModel.find().sort({ createdAt: -1 }).lean<UserDoc[]>();
    return users.map((user) => this.mapToUser(user));
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<IUser[]> {
    const users = await UserDocumentModel.find({ role }).sort({ createdAt: -1 }).lean<UserDoc[]>();
    return users.map((user) => this.mapToUser(user));
  }

  /**
   * Create new user
   */
  async create(data: ICreateUserDTO): Promise<IUser> {
    const user = await UserDocumentModel.create({
      ...data,
      email: data.email.toLowerCase()
    });
    return this.mapToUser(user.toObject() as UserDoc);
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<ICreateUserDTO>): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const updatePayload: Partial<ICreateUserDTO> = { ...data };
    if (updatePayload.email) {
      updatePayload.email = updatePayload.email.toLowerCase();
    }

    const user = await UserDocumentModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true
    }).lean<UserDoc | null>();

    return user ? this.mapToUser(user) : null;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await UserDocumentModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Map database row to IUser interface
   */
  private mapToUser(row: UserDoc): IUser {
    return {
      id: row._id.toString(),
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role as UserRole,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
