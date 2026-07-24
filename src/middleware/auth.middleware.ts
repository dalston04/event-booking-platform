import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util.js';
import { AppError } from '../utils/app-error.js';
import { UserRole } from '../types/auth.types.js';

/**
 * Authentication Middleware
 * Validates incoming Bearer JWT Access Token in the Authorization header
 * and attaches decoded user payload claims to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Authentication required. Missing or malformed Bearer token.');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw AppError.unauthorized('Authentication token missing.');
  }

  // Verify token signature and expiration
  const decodedPayload = JwtUtil.verifyAccessToken(token);

  // Attach decoded user payload to request context
  req.user = decodedPayload;

  next();
}

/**
 * Role-Based Authorization Middleware (RBAC)
 * Restricts access to users with specific roles (e.g., ADMIN)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('User identity not authenticated.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Forbidden access. User role [${req.user.role}] is not authorized for this resource.`,
      );
    }

    next();
  };
}
