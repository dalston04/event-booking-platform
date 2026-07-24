import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.config.js';

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : ['error'],
});

if (env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on('query', (e: any) => {
    logger.debug(`[Prisma Query]: ${e.query} | Duration: ${e.duration}ms`);
  });
}
