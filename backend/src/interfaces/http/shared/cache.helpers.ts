import type { Response as ExpressResponse } from 'express';

type CacheEntry = {
  expiresAt: number;
  staleAt: number;
  value: unknown;
  refreshing?: boolean;
};

type ImageCacheEntry = {
  expiresAt: number;
  value: string | null;
};

interface ApiCacheConfig {
  staleMs: number;
  ttlMs: number;
  aggregatePrefixes: string[];
  aggregateDependencies: string[];
}

export function createApiCacheHelpers(config: ApiCacheConfig) {
  const apiCache = new Map<string, CacheEntry>();
  const apiSingleflight = new Map<string, Promise<unknown>>();
  const aggregateDependenciesSet = new Set(config.aggregateDependencies);

  function buildCacheKey(resource: string, where?: Record<string, unknown>) {
    return `${resource}:${JSON.stringify(where || {})}`;
  }

  function getCachedState<T>(key: string): { value: T; stale: boolean } | null {
    const entry = apiCache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (entry.expiresAt < now) {
      apiCache.delete(key);
      return null;
    }
    return { value: entry.value as T, stale: entry.staleAt < now };
  }

  function isRefreshing(key: string): boolean {
    return apiCache.get(key)?.refreshing === true;
  }

  function markRefreshing(key: string, refreshing: boolean) {
    const entry = apiCache.get(key);
    if (entry) entry.refreshing = refreshing;
  }

  function setCached(key: string, value: unknown) {
    const now = Date.now();
    apiCache.set(key, {
      value,
      staleAt: now + config.staleMs,
      expiresAt: now + config.ttlMs
    });
  }

  async function singleflight<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = apiSingleflight.get(key);
    if (existing) return existing as Promise<T>;
    const promise = (async () => {
      try {
        return await factory();
      } finally {
        apiSingleflight.delete(key);
      }
    })();
    apiSingleflight.set(key, promise);
    return promise;
  }

  async function serveSWR<T>(
    res: ExpressResponse,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ): Promise<void> {
    const state = getCachedState<T>(cacheKey);
    if (state) {
      if (state.stale && !isRefreshing(cacheKey)) {
        markRefreshing(cacheKey, true);
        singleflight(cacheKey, fetchFresh)
          .catch(err => console.error('SWR refresh failed for', cacheKey, err))
          .finally(() => markRefreshing(cacheKey, false));
      }
      const count = Array.isArray(state.value) ? (state.value as any[]).length : 1;
      console.log('Found', count, logLabel, `| cacheHit=true${state.stale ? ' stale' : ''}`);
      res.json(state.value);
      return;
    }
    const fresh = await singleflight(cacheKey, fetchFresh);
    res.json(fresh);
  }

  function invalidateCacheByPrefix(prefix: string) {
    for (const key of apiCache.keys()) {
      if (key.startsWith(`${prefix}:`)) {
        apiCache.delete(key);
      }
    }

    if (aggregateDependenciesSet.has(prefix)) {
      for (const aggregate of config.aggregatePrefixes) {
        for (const key of apiCache.keys()) {
          if (key.startsWith(`${aggregate}:`)) apiCache.delete(key);
        }
      }
    }

    if (prefix === 'collaborators') {
      for (const key of apiCache.keys()) {
        if (key.startsWith('auth-collaborator:')) apiCache.delete(key);
      }
    }
  }

  return {
    buildCacheKey,
    getCachedState,
    isRefreshing,
    markRefreshing,
    setCached,
    singleflight,
    serveSWR,
    invalidateCacheByPrefix
  };
}

export function createImageCacheHelpers(ttlMs: number) {
  const imageCache = new Map<string, ImageCacheEntry>();

  function getCachedImage(key: string): { hit: boolean; value: string | null } {
    const entry = imageCache.get(key);
    if (!entry) return { hit: false, value: null };
    if (entry.expiresAt < Date.now()) {
      imageCache.delete(key);
      return { hit: false, value: null };
    }
    return { hit: true, value: entry.value };
  }

  function setCachedImage(key: string, value: string | null) {
    imageCache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  function invalidateImageCacheByPrefix(prefix: string) {
    for (const key of imageCache.keys()) {
      if (key.startsWith(prefix)) {
        imageCache.delete(key);
      }
    }
  }

  return {
    getCachedImage,
    setCachedImage,
    invalidateImageCacheByPrefix
  };
}
