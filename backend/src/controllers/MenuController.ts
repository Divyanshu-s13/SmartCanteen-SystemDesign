/**
 * Menu Controller
 * Handles menu-related HTTP requests
 */

import { Request, Response } from 'express';
import { menuService } from '../services';
import { MenuCategory } from '../interfaces';
import { asyncHandler } from '../middleware';

export class MenuController {
  /**
   * Get all menu items (available only for students)
   * GET /api/menu
   */
  getAllItems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // If user is admin, get all items including unavailable
    // Otherwise, get only available items
    const isAdmin = req.user?.role === 'admin';

    const result = isAdmin
      ? await menuService.getAllItems()
      : await menuService.getAvailableItems();

    res.status(200).json(result);
  });

  /**
   * Get menu items by category
   * GET /api/menu/category/:category
   */
  getByCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category } = req.params;

    const result = await menuService.getItemsByCategory(category as MenuCategory);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Get menu item by ID
   * GET /api/menu/:id
   */
  getItemById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await menuService.getItemById(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  /**
   * Create new menu item (admin only)
   * POST /api/admin/menu
   */
  createItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    const result = await menuService.createItem({
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
      isAvailable
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Update menu item (admin only)
   * PUT /api/admin/menu/:id
   */
  updateItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    const result = await menuService.updateItem(id, {
      name,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      category,
      imageUrl,
      isAvailable
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(result.error === 'NOT_FOUND' ? 404 : 400).json(result);
    }
  });

  /**
   * Delete menu item (admin only)
   * DELETE /api/admin/menu/:id
   */
  deleteItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await menuService.deleteItem(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  /**
   * Toggle menu item availability (admin only)
   * PATCH /api/admin/menu/:id/toggle
   */
  toggleAvailability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await menuService.toggleAvailability(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  /**
   * Search menu items
   * GET /api/menu/search?q=term
   */
  searchItems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const searchTerm = req.query.q as string;

    const result = await menuService.searchItems(searchTerm || '');

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Get menu grouped by category
   * GET /api/menu/grouped
   */
  getGroupedMenu = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await menuService.getMenuGroupedByCategory();

    res.status(200).json(result);
  });
}

// Export singleton instance
export const menuController = new MenuController();
