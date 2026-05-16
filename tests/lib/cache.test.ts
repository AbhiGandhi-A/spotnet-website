import { cacheFetch, invalidateCache, getCachedValue } from '@/lib/cache';

describe('Cache utilities', () => {
  it('should cache and retrieve a computed value', async () => {
    const key = `test:cache:${Date.now()}`;
    const result = await cacheFetch(key, 1, async () => ({ value: 'cached' }));
    expect(result).toEqual({ value: 'cached' });

    const cached = await getCachedValue<{ value: string }>(key);
    expect(cached).toEqual({ value: 'cached' });

    await invalidateCache(key);
    const invalidated = await getCachedValue<{ value: string }>(key);
    expect(invalidated).toBeNull();
  });
});
