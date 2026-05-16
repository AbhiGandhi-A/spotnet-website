import { deleteCache, getCache, setCache } from '@/lib/redis';

export async function cacheFetch<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  const value = await loader();
  await setCache(key, value, ttlSeconds);
  return value;
}

export async function invalidateCache(key: string) {
  await deleteCache(key);
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  return getCache<T>(key);
}

export async function setCachedValue<T>(key: string, value: T, ttlSeconds: number) {
  await setCache(key, value, ttlSeconds);
}
