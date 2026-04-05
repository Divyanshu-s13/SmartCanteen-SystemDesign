/**
 * Menu Service
 * Handles menu item management
 * Follows Single Responsibility Principle (SRP)
 */

import { menuRepository, MenuRepository } from '../repositories';
import {
  IMenuItem,
  ICreateMenuItemDTO,
  IUpdateMenuItemDTO,
  MenuCategory,
  IApiResponse
} from '../interfaces';

export class MenuService {
  private menuRepository: MenuRepository;

  constructor(menuRepo?: MenuRepository) {
    // Dependency Injection
    this.menuRepository = menuRepo || menuRepository;
  }

  /**
   * Get all menu items
   */
  async getAllItems(): Promise<IApiResponse<IMenuItem[]>> {
    try {
      const items = await this.menuRepository.findAll();

      return {
        success: true,
        message: 'Menu items retrieved successfully',
        data: items
      };
    } catch (error) {
      console.error('Get menu items error:', error);
      return {
        success: false,
        message: 'Failed to retrieve menu items',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get available menu items (for students)
   */
  async getAvailableItems(): Promise<IApiResponse<IMenuItem[]>> {
    try {
      const items = await this.menuRepository.findAvailable();

      return {
        success: true,
        message: 'Available menu items retrieved successfully',
        data: items
      };
    } catch (error) {
      console.error('Get available menu items error:', error);
      return {
        success: false,
        message: 'Failed to retrieve menu items',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get menu items by category
   */
  async getItemsByCategory(category: MenuCategory): Promise<IApiResponse<IMenuItem[]>> {
    try {
      // Validate category
      if (!Object.values(MenuCategory).includes(category)) {
        return {
          success: false,
          message: 'Invalid category',
          error: 'VALIDATION_ERROR'
        };
      }

      const items = await this.menuRepository.findByCategory(category);

      return {
        success: true,
        message: `Menu items in ${category} category retrieved successfully`,
        data: items
      };
    } catch (error) {
      console.error('Get items by category error:', error);
      return {
        success: false,
        message: 'Failed to retrieve menu items',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get menu item by ID
   */
  async getItemById(id: string): Promise<IApiResponse<IMenuItem>> {
    try {
      const item = await this.menuRepository.findById(id);

      if (!item) {
        return {
          success: false,
          message: 'Menu item not found',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Menu item retrieved successfully',
        data: item
      };
    } catch (error) {
      console.error('Get menu item error:', error);
      return {
        success: false,
        message: 'Failed to retrieve menu item',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Create new menu item (admin only)
   */
  async createItem(data: ICreateMenuItemDTO): Promise<IApiResponse<IMenuItem>> {
    try {
      // Validate input
      if (!data.name || !data.price || !data.category) {
        return {
          success: false,
          message: 'Name, price, and category are required',
          error: 'VALIDATION_ERROR'
        };
      }

      if (data.price <= 0) {
        return {
          success: false,
          message: 'Price must be greater than 0',
          error: 'VALIDATION_ERROR'
        };
      }

      if (!Object.values(MenuCategory).includes(data.category)) {
        return {
          success: false,
          message: 'Invalid category',
          error: 'VALIDATION_ERROR'
        };
      }

      const item = await this.menuRepository.create(data);

      return {
        success: true,
        message: 'Menu item created successfully',
        data: item
      };
    } catch (error) {
      console.error('Create menu item error:', error);
      return {
        success: false,
        message: 'Failed to create menu item',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Update menu item (admin only)
   */
  async updateItem(id: string, data: IUpdateMenuItemDTO): Promise<IApiResponse<IMenuItem>> {
    try {
      // Check if item exists
      const existingItem = await this.menuRepository.findById(id);
      if (!existingItem) {
        return {
          success: false,
          message: 'Menu item not found',
          error: 'NOT_FOUND'
        };
      }

      // Validate price if provided
      if (data.price !== undefined && data.price <= 0) {
        return {
          success: false,
          message: 'Price must be greater than 0',
          error: 'VALIDATION_ERROR'
        };
      }

      // Validate category if provided
      if (data.category && !Object.values(MenuCategory).includes(data.category)) {
        return {
          success: false,
          message: 'Invalid category',
          error: 'VALIDATION_ERROR'
        };
      }

      const updatedItem = await this.menuRepository.update(id, data);

      return {
        success: true,
        message: 'Menu item updated successfully',
        data: updatedItem!
      };
    } catch (error) {
      console.error('Update menu item error:', error);
      return {
        success: false,
        message: 'Failed to update menu item',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Delete menu item (admin only)
   */
  async deleteItem(id: string): Promise<IApiResponse> {
    try {
      // Check if item exists
      const existingItem = await this.menuRepository.findById(id);
      if (!existingItem) {
        return {
          success: false,
          message: 'Menu item not found',
          error: 'NOT_FOUND'
        };
      }

      await this.menuRepository.delete(id);

      return {
        success: true,
        message: 'Menu item deleted successfully'
      };
    } catch (error) {
      console.error('Delete menu item error:', error);
      return {
        success: false,
        message: 'Failed to delete menu item',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Toggle menu item availability (admin only)
   */
  async toggleAvailability(id: string): Promise<IApiResponse<IMenuItem>> {
    try {
      const updatedItem = await this.menuRepository.toggleAvailability(id);

      if (!updatedItem) {
        return {
          success: false,
          message: 'Menu item not found',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        message: `Menu item is now ${updatedItem.isAvailable ? 'available' : 'unavailable'}`,
        data: updatedItem
      };
    } catch (error) {
      console.error('Toggle availability error:', error);
      return {
        success: false,
        message: 'Failed to toggle availability',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Search menu items
   */
  async searchItems(searchTerm: string): Promise<IApiResponse<IMenuItem[]>> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          success: false,
          message: 'Search term must be at least 2 characters',
          error: 'VALIDATION_ERROR'
        };
      }

      const items = await this.menuRepository.search(searchTerm.trim());

      return {
        success: true,
        message: `Found ${items.length} items`,
        data: items
      };
    } catch (error) {
      console.error('Search menu items error:', error);
      return {
        success: false,
        message: 'Failed to search menu items',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get menu grouped by category
   */
  async getMenuGroupedByCategory(): Promise<IApiResponse<Record<string, IMenuItem[]>>> {
    try {
      const items = await this.menuRepository.findAvailable();

      const grouped = items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, IMenuItem[]>);

      return {
        success: true,
        message: 'Menu retrieved successfully',
        data: grouped
      };
    } catch (error) {
      console.error('Get grouped menu error:', error);
      return {
        success: false,
        message: 'Failed to retrieve menu',
        error: 'INTERNAL_ERROR'
      };
    }
  }
}

// Export singleton instance
export const menuService = new MenuService();
