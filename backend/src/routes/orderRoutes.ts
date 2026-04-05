/**
 * Order Routes
 * Routes for order endpoints
 */

import { Router } from 'express';
import { orderController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Student routes
router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/queue-position', orderController.getQueuePosition);
router.delete('/:id', orderController.cancelOrder);

export default router;
