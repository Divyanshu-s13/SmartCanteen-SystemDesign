/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */

import { Request, Response } from 'express';
import { authService } from '../services';
import { UserRole } from '../interfaces';
import { asyncHandler } from '../middleware';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/signup
   */
  signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;

    const result = await authService.register({
      name,
      email,
      password,
      role: role || UserRole.STUDENT
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  });

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const result = await authService.getProfile(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { name, email } = req.body;

    const result = await authService.updateProfile(userId, { name, email });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Change password
   * PUT /api/auth/password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Verify token
   * GET /api/auth/verify
   */
  verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // If we reach here, token is valid (authenticated middleware passed)
    const result = await authService.getProfile(req.user!.userId);
    res.status(200).json(result);
  });
}

// Export singleton instance
export const authController = new AuthController();
