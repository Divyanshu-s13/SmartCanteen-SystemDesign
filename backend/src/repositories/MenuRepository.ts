/**
 * Menu Repository
 * Data access layer for Menu entity
 * Implements IMenuRepository interface
 */

import { query } from '../config/database';
import { IMenuItem, ICreateMenuItemDTO, IUpdateMenuItemDTO, MenuCategory } from '../interfaces';
import { IMenuRepository } from '../interfaces/repositories';

export class MenuRepository implements IMenuRepository {
  /**
   * Find menu item by ID
   */
  async findById(id: string): Promise<IMenuItem | null> {
    const result = await query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToMenuItem(result.rows[0]);
  }

  /**
   * Find all menu items
   */
  async findAll(): Promise<IMenuItem[]> {
    const result = await query(
      'SELECT * FROM menu_items ORDER BY category, name'
    );

    return result.rows.map(this.mapToMenuItem);
  }

  /**
   * Find menu items by category
   */
  async findByCategory(category: MenuCategory): Promise<IMenuItem[]> {
    const result = await query(
      'SELECT * FROM menu_items WHERE category = $1 ORDER BY name',
      [category]
    );

    return result.rows.map(this.mapToMenuItem);
  }

  /**
   * Find available menu items
   */
  async findAvailable(): Promise<IMenuItem[]> {
    const result = await query(
      'SELECT * FROM menu_items WHERE is_available = true ORDER BY category, name'
    );

    return result.rows.map(this.mapToMenuItem);
  }

  /**
   * Find available menu items by category
   */
  async findAvailableByCategory(category: MenuCategory): Promise<IMenuItem[]> {
    const result = await query(
      'SELECT * FROM menu_items WHERE category = $1 AND is_available = true ORDER BY name',
      [category]
    );

    return result.rows.map(this.mapToMenuItem);
  }

  /**
   * Create new menu item
   */
  async create(data: ICreateMenuItemDTO): Promise<IMenuItem> {
    const result = await query(
      `INSERT INTO menu_items (name, description, price, category, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.description,
        data.price,
        data.category,
        data.imageUrl || null,
        data.isAvailable ?? true
      ]
    );

    return this.mapToMenuItem(result.rows[0]);
  }

  /**
   * Update menu item
   */
  async update(id: string, data: IUpdateMenuItemDTO): Promise<IMenuItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(data.price);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(data.category);
    }
    if (data.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(data.imageUrl);
    }
    if (data.isAvailable !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(data.isAvailable);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToMenuItem(result.rows[0]);
  }

  /**
   * Delete menu item
   */
  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM menu_items WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Toggle menu item availability
   */
  async toggleAvailability(id: string): Promise<IMenuItem | null> {
    const result = await query(
      `UPDATE menu_items SET is_available = NOT is_available WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToMenuItem(result.rows[0]);
  }

  /**
   * Search menu items by name
   */
  async search(searchTerm: string): Promise<IMenuItem[]> {
    const result = await query(
      `SELECT * FROM menu_items
       WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1
       ORDER BY category, name`,
      [`%${searchTerm.toLowerCase()}%`]
    );

    return result.rows.map(this.mapToMenuItem);
  }

  /**
   * Map database row to IMenuItem interface
   */
  private mapToMenuItem(row: any): IMenuItem {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      price: parseFloat(row.price),
      category: row.category as MenuCategory,
      imageUrl: row.image_url,
      isAvailable: row.is_available,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Export singleton instance
export const menuRepository = new MenuRepository();
