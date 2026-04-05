/**
 * Payment Routes
 * Routes for payment endpoints
 */

import { Router } from 'express';
import { paymentController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

// Public route
router.get('/methods', paymentController.getPaymentMethods);

// Protected routes
router.use(authenticate);

router.post('/', paymentController.processPayment);
router.get('/:id', paymentController.getPaymentById);
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

export default router;
