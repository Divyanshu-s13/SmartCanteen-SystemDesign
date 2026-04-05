/**
 * Menu Routes
 * Routes for menu endpoints
 */

import { Router } from 'express';
import { menuController } from '../controllers';
import { authenticate, requireAdmin, optionalAuth } from '../middleware';

const router = Router();

// Public routes (with optional auth for admin detection)
router.get('/', optionalAuth, menuController.getAllItems);
router.get('/grouped', menuController.getGroupedMenu);
router.get('/search', menuController.searchItems);
router.get('/category/:category', menuController.getByCategory);
router.get('/:id', menuController.getItemById);

// Admin routes (separate file but can be included here too)
// These will be prefixed with /api/admin/menu in admin routes

export default router;
