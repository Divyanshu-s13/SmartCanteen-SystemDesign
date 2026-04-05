/**
 * Middleware Index
 * Export all middleware functions
 */

export {
  authenticate,
  requireAdmin,
  requireStudent,
  requireRoles,
  optionalAuth
} from './auth';

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  errorHandler,
  notFoundHandler,
  asyncHandler
} from './errorHandler';
