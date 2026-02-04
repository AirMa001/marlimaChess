import { Redis as UpstashRedis } from '@upstash/redis';
import Redis from 'ioredis'; // You'll need to: npm install ioredis

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const localRedisUrl = process.env.REDIS_URL; // e.g., redis://localhost:6379

function getRedisClient() {
  // 1. Try Upstash (Production/Vercel)
  if (redisUrl && redisToken) {
    return new UpstashRedis({ url: redisUrl, token: redisToken });
  }

  // 2. Try Local Docker (Development)
  if (localRedisUrl) {
    return new Redis(localRedisUrl) as any; 
  }

  console.warn('⚠️ No Redis configuration found. Caching is disabled.');
  return null;
}

export const redis = getRedisClient();