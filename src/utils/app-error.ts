export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  public static unauthorized(message = 'Unauthorized access'): AppError {
    return new AppError(message, 401);
  }

  public static forbidden(message = 'Forbidden access'): AppError {
    return new AppError(message, 403);
  }

  public static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404);
  }

  public static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  public static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, false);
  }
}
