/**
 * Authentication Middleware
 * Handles JWT verification and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { UserRole, IJWTPayload } from '../interfaces';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

/**
 * Middleware to verify JWT token
 * Attaches user payload to request if valid
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'NO_TOKEN'
      });
      return;
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format. Use Bearer token.',
        error: 'INVALID_FORMAT'
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const payload = authService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if user is admin
 * Must be used after authenticate middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NO_AUTH'
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'FORBIDDEN'
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is student
 * Must be used after authenticate middleware
 */
export const requireStudent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NO_AUTH'
    });
    return;
  }

  if (req.user.role !== UserRole.STUDENT) {
    res.status(403).json({
      success: false,
      message: 'Student access required',
      error: 'FORBIDDEN'
    });
    return;
  }

  next();
};

/**
 * Middleware factory for role-based access
 * @param roles - Allowed roles
 */
export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NO_AUTH'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Required role: ${roles.join(' or ')}`,
        error: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};
