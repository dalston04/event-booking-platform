import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection string' }),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET must be at least 32 characters long' }),
  JWT_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_SECRET: z.string().min(32, { message: 'REFRESH_TOKEN_SECRET must be at least 32 characters long' }),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ FATAL: Invalid Environment Configuration Variables');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
