import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/redis.client.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

/**
 * Distributed Redis Rate Limiting Middleware
 * Tracks request counts per IP across all container instances
 */
export function rateLimiter(options: RateLimitOptions) {
  const { windowSeconds, maxRequests, keyPrefix = 'rate_limit' } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const key = `${keyPrefix}:${clientIp}`;

      // Atomic increment in Redis
      const currentCount = await redis.incr(key);

      // Set expiration on first request in window
      if (currentCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);

      // Set standard HTTP RateLimit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));
      res.setHeader('X-RateLimit-Reset', Date.now() + ttl * 1000);

      if (currentCount > maxRequests) {
        res.setHeader('Retry-After', ttl);
        throw AppError.badRequest(
          `Too many requests. Rate limit exceeded. Please try again in ${ttl} seconds.`,
        );
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        res.status(429).json({
          status: 'fail',
          message: err.message,
        });
        return;
      }
      logger.error(err, '[RateLimiter Error]: Bypassing rate limiter due to Redis error');
      next(); // Fail-open principle: Allow traffic if rate limiter errors out
    }
  };
}
