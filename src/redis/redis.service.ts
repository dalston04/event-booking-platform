import { redis } from './redis.client.js';
import { logger } from '../utils/logger.js';

export class RedisService {
  /**
   * Retrieves a parsed JSON payload from Redis cache
   */
  public async getJson<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.error(err, `[Redis Cache Get Error]: Failed for key [${key}]`);
      return null;
    }
  }

  /**
   * Stores a JSON payload in Redis cache with an optional Time-To-Live (TTL in seconds)
   */
  public async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redis.set(key, serialized);
      }
    } catch (err) {
      logger.error(err, `[Redis Cache Set Error]: Failed for key [${key}]`);
    }
  }

  /**
   * Deletes a specific cache key (Cache Invalidation)
   */
  public async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      logger.error(err, `[Redis Cache Del Error]: Failed for key [${key}]`);
    }
  }

  /**
   * Deletes all cache keys matching a specific wildcard pattern (e.g. "event:*")
   */
  public async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.error(err, `[Redis Cache DelPattern Error]: Failed for pattern [${pattern}]`);
    }
  }

  /**
   * Acquires a Distributed Lock using atomic SET NX PX command
   * @param resource Lock key identifier (e.g., "lock:event:booking:123")
   * @param lockId Random unique identifier to prevent lock hijacking
   * @param ttlMs Time-To-Live in milliseconds before auto-releasing
   * @returns Promise resolving to true if acquired, false if locked by another node
   */
  public async acquireLock(resource: string, lockId: string, ttlMs = 5000): Promise<boolean> {
    try {
      const result = await redis.set(resource, lockId, 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (err) {
      logger.error(err, `[Redis Distributed Lock Acquire Error]: Resource [${resource}]`);
      return false;
    }
  }

  /**
   * Releases a Distributed Lock safely using a Lua script to ensure lock ownership
   */
  public async releaseLock(resource: string, lockId: string): Promise<boolean> {
    try {
      // Lua script ensures atomic check-and-delete: Only release lock if lockId matches!
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await redis.eval(luaScript, 1, resource, lockId);
      return result === 1;
    } catch (err) {
      logger.error(err, `[Redis Distributed Lock Release Error]: Resource [${resource}]`);
      return false;
    }
  }
}

export const redisService = new RedisService();
