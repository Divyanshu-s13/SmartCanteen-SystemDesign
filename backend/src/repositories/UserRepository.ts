/**
 * User Repository
 * Data access layer for User entity
 * Implements IUserRepository interface
 */

import { query } from '../config/database';
import { IUser, ICreateUserDTO, UserRole } from '../interfaces';
import { IUserRepository } from '../interfaces/repositories';

export class UserRepository implements IUserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUser(result.rows[0]);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUser(result.rows[0]);
  }

  /**
   * Find all users
   */
  async findAll(): Promise<IUser[]> {
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    return result.rows.map(this.mapToUser);
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<IUser[]> {
    const result = await query(
      'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    );

    return result.rows.map(this.mapToUser);
  }

  /**
   * Create new user
   */
  async create(data: ICreateUserDTO): Promise<IUser> {
    const result = await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.email.toLowerCase(), data.password, data.role]
    );

    return this.mapToUser(result.rows[0]);
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<ICreateUserDTO>): Promise<IUser | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email.toLowerCase());
    }
    if (data.password) {
      updates.push(`password = $${paramCount++}`);
      values.push(data.password);
    }
    if (data.role) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUser(result.rows[0]);
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Map database row to IUser interface
   */
  private mapToUser(row: any): IUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role as UserRole,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
