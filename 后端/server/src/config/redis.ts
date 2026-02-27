import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2000);
  }
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (error: Error) => {
  logger.error('Redis error', { message: error.message });
});

export const getRedisClient = (): Redis => redis;

export const closeRedisClient = async (): Promise<void> => {
  try {
    await redis.quit();
  } catch {
    redis.disconnect(false);
  }
};

export default redis;
