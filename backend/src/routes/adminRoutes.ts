/**
 * Admin Routes
 * Routes for admin-only endpoints
 */

import { Router } from 'express';
import { menuController, orderController, paymentController } from '../controllers';
import { authenticate, requireAdmin } from '../middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', orderController.getDashboardStats);

// Menu management
router.post('/menu', menuController.createItem);
router.put('/menu/:id', menuController.updateItem);
router.delete('/menu/:id', menuController.deleteItem);
router.patch('/menu/:id/toggle', menuController.toggleAvailability);

// Order management
router.get('/orders', orderController.getAllOrders);
router.get('/orders/active', orderController.getActiveOrders);
router.patch('/orders/:id/status', orderController.updateOrderStatus);

// Payment management
router.get('/payments', paymentController.getAllPayments);
router.get('/payments/stats', paymentController.getPaymentStats);
router.post('/payments/:orderId/refund', paymentController.processRefund);

export default router;
