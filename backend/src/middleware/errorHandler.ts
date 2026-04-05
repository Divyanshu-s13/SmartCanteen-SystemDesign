/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const BadRequestError = (message: string) =>
  new AppError(message, 400, 'BAD_REQUEST');

export const UnauthorizedError = (message: string = 'Unauthorized') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const ForbiddenError = (message: string = 'Forbidden') =>
  new AppError(message, 403, 'FORBIDDEN');

export const NotFoundError = (message: string = 'Not found') =>
  new AppError(message, 404, 'NOT_FOUND');

export const ConflictError = (message: string) =>
  new AppError(message, 409, 'CONFLICT');

export const ValidationError = (message: string) =>
  new AppError(message, 422, 'VALIDATION_ERROR');

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode
    });
    return;
  }

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED'
    });
    return;
  }

  // PostgreSQL unique constraint violation
  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'DUPLICATE_ENTRY'
    });
    return;
  }

  // PostgreSQL foreign key violation
  if ((err as any).code === '23503') {
    res.status(400).json({
      success: false,
      message: 'Referenced resource not found',
      error: 'FOREIGN_KEY_VIOLATION'
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    error: 'INTERNAL_ERROR'
  });
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND'
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
