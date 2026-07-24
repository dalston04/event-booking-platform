import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/app-error.js';

/**
 * Generic Zod Payload Validation Middleware for req.body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`,
      );
      throw AppError.badRequest(`Validation failed: ${formattedErrors.join('; ')}`);
    }

    req.body = result.data;
    next();
  };
}

/**
 * Generic Zod Query Validation Middleware for req.query (Compatible with Express 5 getters)
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const formattedErrors = result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'query'}: ${issue.message}`,
      );
      throw AppError.badRequest(`Query validation failed: ${formattedErrors.join('; ')}`);
    }

    // In Express 5, req.query has only a getter, so we mutate properties via Object.assign
    Object.assign(req.query, result.data);
    next();
  };
}
