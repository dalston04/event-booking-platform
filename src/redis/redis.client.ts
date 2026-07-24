import { Redis } from 'ioredis';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: null,
  retryStrategy(times: number): number | null {
    if (times > 5) {
      logger.warn('[Redis Connection]: Max connection retries reached. Operating in fail-open fallback mode.');
      return null; // Stop retrying after 5 attempts so Node app doesn't crash
    }
    const delay = Math.min(times * 200, 2000);
    logger.warn(`[Redis Connection]: Retrying connection (Attempt ${times})...`);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info(`🚀 Redis client connected to [${env.REDIS_HOST}:${env.REDIS_PORT}]`);
});

redis.on('error', (err) => {
  logger.warn(`[Redis Notice]: Connection issue (${err.message})`);
});
