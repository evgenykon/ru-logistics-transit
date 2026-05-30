import Redis from 'ioredis';
import { logger } from './helpers/logger.helper';

class Cache {
  private client: Redis;
  private readonly REDIS_URL: string = process.env.REDIS_URL || 'redis://redis:6379';

  constructor() {
    this.client = new Redis(this.REDIS_URL);

    this.client.on('connect', () => {
      logger.info('Redis connected successfully!');
    });

    this.client.on('error', (err) => {
      logger.error({ msg: 'Redis connection error:', err });
    });
  }

  public async set(key: string, value: string, time?: number): Promise<string | null> {
    try {
      return time ? await this.client.set(key, value, 'EX', time) : await this.client.set(key, value);
    } catch (error) {
      logger.error({ msg: `Error setting key ${key} in Redis:`, error });
      return null;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error({ msg: `Error getting key ${key} from Redis:`, error });
      return null;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error({ msg: `Error deleting key ${key} from Redis:`, error });
      return 0;
    }
  }

  public async lock(key: string, value: string, expiry: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, value, 'PX', expiry, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error({ msg: `Error acquiring lock ${key} in Redis:`, error });
      return false;
    }
  }

  public async unlock(key: string, value: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      const result = await this.client.eval(script, 1, key, value);
      return result === 1;
    } catch (error) {
      logger.error({ msg: `Error releasing lock ${key} in Redis:`, error });
      return false;
    }
  }

  public async quit(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis connection closed.');
    } catch (error) {
      logger.error({ msg: 'Error closing Redis connection:', error });
    }
  }

  public async flushAll(): Promise<string> {
    try {
      const result = await this.client.flushdb();
      logger.info('Redis cache flushed.');
      return result;
    } catch (error) {
      logger.error({ msg: 'Error flushing Redis cache:', error });
      throw error;
    }
  }

  public async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error({ msg: `Error incrementing key ${key} in Redis:`, error });
      return 0;
    }
  }

  public async incrbyfloat(key: string, increment: number): Promise<string> {
    try {
      return await this.client.incrbyfloat(key, increment);
    } catch (error) {
      logger.error({ msg: `Error incrementing float key ${key} in Redis:`, error });
      return '0';
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error({ msg: `Error setting expiry for key ${key} in Redis:`, error });
      return false;
    }
  }

  public async incrIfUnderLimit(key: string, max: number, ttlSeconds?: number): Promise<number> {
    const script = `
      local val = redis.call("GET", KEYS[1])
      if val and tonumber(val) >= tonumber(ARGV[1]) then
        return -1
      end
      local new = redis.call("INCR", KEYS[1])
      if tonumber(ARGV[2]) > 0 then
        redis.call("EXPIRE", KEYS[1], ARGV[2])
      end
      return new
    `;
    try {
      const result = await this.client.eval(script, 1, key, String(max), String(ttlSeconds ?? 0));
      return Number(result);
    } catch (error) {
      logger.error({ msg: `Error in incrIfUnderLimit for key ${key}:`, error });
      return -1;
    }
  }
}

export const cache = new Cache();
