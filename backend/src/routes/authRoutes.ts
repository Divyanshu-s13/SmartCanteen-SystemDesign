/**
 * Auth Routes
 * Routes for authentication endpoints
 */

import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/password', authenticate, authController.changePassword);
router.get('/verify', authenticate, authController.verifyToken);

export default router;
