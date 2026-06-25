import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { CacheService } from '../../../infrastructure/cache/cache.service.js';

describe('CacheService', () => {
  const oldStale = process.env.API_CACHE_STALE_MS;
  const oldTtl = process.env.API_CACHE_TTL_MS;

  beforeEach(() => {
    delete process.env.API_CACHE_STALE_MS;
    delete process.env.API_CACHE_TTL_MS;
  });

  afterEach(() => {
    if (oldStale == null) delete process.env.API_CACHE_STALE_MS;
    else process.env.API_CACHE_STALE_MS = oldStale;

    if (oldTtl == null) delete process.env.API_CACHE_TTL_MS;
    else process.env.API_CACHE_TTL_MS = oldTtl;
  });

  it('stores and returns cached values', () => {
    const cache = new CacheService();
    cache.set('k1', { ok: true });

    const state = cache.get<{ ok: boolean }>('k1');
    expect(state).not.toBeNull();
    expect(state?.value.ok).toBe(true);
    expect(state?.stale).toBe(false);
  });

  it('invalidates keys by prefix', () => {
    const cache = new CacheService();
    cache.set('initiatives:list:a', 1);
    cache.set('initiatives:id:b', 2);
    cache.set('systems:list:a', 3);

    cache.invalidatePrefix('initiatives');

    expect(cache.get('initiatives:list:a')).toBeNull();
    expect(cache.get('initiatives:id:b')).toBeNull();
    expect(cache.get('systems:list:a')?.value).toBe(3);
  });

  it('deduplicates concurrent factory execution with singleflight', async () => {
    const cache = new CacheService();
    const factory = jest.fn(async () => 'value');

    const [a, b] = await Promise.all([
      cache.singleflight('same', factory),
      cache.singleflight('same', factory)
    ]);

    expect(a).toBe('value');
    expect(b).toBe('value');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('returns cached value and starts background refresh when stale', async () => {
    process.env.API_CACHE_STALE_MS = '60000';
    process.env.API_CACHE_TTL_MS = '60000';
    const cache = new CacheService();

    cache.set('initiatives:list:c1:d1', ['old']);
    const entry = (cache as any).store.get('initiatives:list:c1:d1');
    entry.staleAt = Date.now() - 1;

    const factory = jest.fn(async () => ['new']);

    const result = await cache.getOrFetch<string[]>('initiatives:list:c1:d1', factory);
    expect(result).toEqual(['old']);

    // Allow background refresh promise to settle.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(factory).toHaveBeenCalledTimes(1);
    expect(cache.get<string[]>('initiatives:list:c1:d1')?.value).toEqual(['new']);
  });

  it('evicts expired entries', async () => {
    process.env.API_CACHE_STALE_MS = '0';
    process.env.API_CACHE_TTL_MS = '1';
    const cache = new CacheService();

    cache.set('k2', 123);
    await new Promise(resolve => setTimeout(resolve, 5));

    expect(cache.get('k2')).toBeNull();
  });
});

