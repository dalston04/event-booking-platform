import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.config.js';

export function globalErrorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error using Pino
  if (statusCode >= 500) {
    logger.error(err, `[500 Internal Error]: ${err.message}`);
  } else {
    logger.warn(`[${statusCode} Operational Warning]: ${err.message}`);
  }

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
