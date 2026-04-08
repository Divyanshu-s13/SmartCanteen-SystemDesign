/**
 * Menu Repository
 * Data access layer for Menu entity
 * Implements IMenuRepository interface
 */

import { Types } from 'mongoose';
import { MenuItemDocumentModel, MenuItemDoc } from '../db/models';
import { IMenuItem, ICreateMenuItemDTO, IUpdateMenuItemDTO, MenuCategory } from '../interfaces';
import { IMenuRepository } from '../interfaces/repositories';

export class MenuRepository implements IMenuRepository {
  /**
   * Find menu item by ID
   */
  async findById(id: string): Promise<IMenuItem | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const item = await MenuItemDocumentModel.findById(id).lean<MenuItemDoc | null>();
    return item ? this.mapToMenuItem(item) : null;
  }

  /**
   * Find all menu items
   */
  async findAll(): Promise<IMenuItem[]> {
    const items = await MenuItemDocumentModel.find().sort({ category: 1, name: 1 }).lean<MenuItemDoc[]>();
    return items.map((item) => this.mapToMenuItem(item));
  }

  /**
   * Find menu items by category
   */
  async findByCategory(category: MenuCategory): Promise<IMenuItem[]> {
    const items = await MenuItemDocumentModel.find({ category }).sort({ name: 1 }).lean<MenuItemDoc[]>();
    return items.map((item) => this.mapToMenuItem(item));
  }

  /**
   * Find available menu items
   */
  async findAvailable(): Promise<IMenuItem[]> {
    const items = await MenuItemDocumentModel.find({ isAvailable: true })
      .sort({ category: 1, name: 1 })
      .lean<MenuItemDoc[]>();
    return items.map((item) => this.mapToMenuItem(item));
  }

  /**
   * Find available menu items by category
   */
  async findAvailableByCategory(category: MenuCategory): Promise<IMenuItem[]> {
    const items = await MenuItemDocumentModel.find({ category, isAvailable: true })
      .sort({ name: 1 })
      .lean<MenuItemDoc[]>();
    return items.map((item) => this.mapToMenuItem(item));
  }

  /**
   * Create new menu item
   */
  async create(data: ICreateMenuItemDTO): Promise<IMenuItem> {
    const item = await MenuItemDocumentModel.create({
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      imageUrl: data.imageUrl || null,
      isAvailable: data.isAvailable ?? true
    });

    return this.mapToMenuItem(item.toObject() as MenuItemDoc);
  }

  /**
   * Update menu item
   */
  async update(id: string, data: IUpdateMenuItemDTO): Promise<IMenuItem | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const item = await MenuItemDocumentModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    }).lean<MenuItemDoc | null>();

    return item ? this.mapToMenuItem(item) : null;
  }

  /**
   * Delete menu item
   */
  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await MenuItemDocumentModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Toggle menu item availability
   */
  async toggleAvailability(id: string): Promise<IMenuItem | null> {
    const item = await this.findById(id);
    if (!item) {
      return null;
    }

    const updated = await MenuItemDocumentModel.findByIdAndUpdate(
      id,
      { isAvailable: !item.isAvailable },
      { new: true }
    ).lean<MenuItemDoc | null>();

    return updated ? this.mapToMenuItem(updated) : null;
  }

  /**
   * Search menu items by name
   */
  async search(searchTerm: string): Promise<IMenuItem[]> {
    const searchRegex = new RegExp(searchTerm.trim(), 'i');
    const items = await MenuItemDocumentModel.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }).sort({ category: 1, name: 1 }).lean<MenuItemDoc[]>();

    return items.map((item) => this.mapToMenuItem(item));
  }

  /**
   * Map database row to IMenuItem interface
   */
  private mapToMenuItem(row: MenuItemDoc): IMenuItem {
    return {
      id: row._id.toString(),
      name: row.name,
      description: row.description || '',
      price: Number(row.price),
      category: row.category as MenuCategory,
      imageUrl: row.imageUrl || undefined,
      isAvailable: row.isAvailable,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}

// Export singleton instance
export const menuRepository = new MenuRepository();
