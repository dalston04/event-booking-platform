import { Redis } from 'ioredis';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

const isProduction = env.NODE_ENV === 'production' || env.REDIS_HOST.includes('upstash.io');

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  tls: isProduction ? {} : undefined, // TLS encryption required for Upstash Cloud Redis
  lazyConnect: true,
  maxRetriesPerRequest: null,
  retryStrategy(times: number): number | null {
    if (times > 5) {
      logger.warn('[Redis Connection]: Max retries reached. Fallback mode active.');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => {
  logger.info(`🚀 Redis client connected to [${env.REDIS_HOST}:${env.REDIS_PORT}]`);
});

redis.on('error', (err) => {
  logger.warn(`[Redis Notice]: Connection issue (${err.message})`);
});
