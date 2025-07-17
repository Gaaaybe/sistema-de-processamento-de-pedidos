import { Redis } from 'ioredis';
import { env } from '@/env';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.NODE_ENV === 'test' ? 1 : env.REDIS_DB,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.NODE_ENV === 'test' ? 1 : env.REDIS_DB,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

export async function cleanRedis() {
  if (env.NODE_ENV === 'test') {
    await redis.flushdb();
  }
}

export async function checkRedisConnection() {
  try {
    await redis.ping();
    console.log('✅ Redis connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}