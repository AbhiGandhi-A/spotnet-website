import { getRedisClient } from '@/lib/redis';

export async function cacheSet(key: string, value: any, ttlSeconds = 300) {
  const redis = getRedisClient();
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.set(key, payload, 'EX', ttlSeconds);
  } else {
    await redis.set(key, payload);
  }
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export async function cacheDelete(...keys: string[]) {
  const redis = getRedisClient();
  if (keys.length === 0) return;
  await redis.del(...keys);
}

export async function cacheHas(key: string) {
  const redis = getRedisClient();
  return (await redis.exists(key)) === 1;
}

export async function cacheIncr(key: string, ttlSeconds = 60) {
  const redis = getRedisClient();
  const value = await redis.incr(key);
  if (value === 1 && ttlSeconds > 0) {
    await redis.expire(key, ttlSeconds);
  }
  return value;
}

export async function cacheExpire(key: string, ttlSeconds: number) {
  const redis = getRedisClient();
  await redis.expire(key, ttlSeconds);
}
