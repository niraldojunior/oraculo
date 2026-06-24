import { Injectable } from '@nestjs/common';

type CacheEntry = {
  value: unknown;
  staleAt: number;
  expiresAt: number;
  refreshing: boolean;
};

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly inflight = new Map<string, Promise<unknown>>();

  private readonly staleMs: number;
  private readonly ttlMs: number;

  constructor() {
    this.staleMs = Number(process.env.API_CACHE_STALE_MS || 60_000);
    this.ttlMs = Number(process.env.API_CACHE_TTL_MS || 300_000);
  }

  get<T>(key: string): { value: T; stale: boolean } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (entry.expiresAt < now) {
      this.store.delete(key);
      return null;
    }

    return { value: entry.value as T, stale: entry.staleAt < now };
  }

  set(key: string, value: unknown): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      staleAt: now + this.staleMs,
      expiresAt: now + this.ttlMs,
      refreshing: false
    });
  }

  isRefreshing(key: string): boolean {
    return this.store.get(key)?.refreshing === true;
  }

  markRefreshing(key: string, value: boolean): void {
    const entry = this.store.get(key);
    if (entry) entry.refreshing = value;
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(`${prefix}:`)) {
        this.store.delete(key);
      }
    }
  }

  async singleflight<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = (async () => {
      try {
        return await factory();
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }

  /**
   * Stale-While-Revalidate: retorna o valor em cache imediatamente (mesmo stale)
   * e dispara refresh em background se necessário.
   * Se não houver cache, executa o factory e armazena o resultado.
   */
  async getOrFetch<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const state = this.get<T>(key);

    if (state) {
      if (state.stale && !this.isRefreshing(key)) {
        this.markRefreshing(key, true);
        this.singleflight(key, factory)
          .then(fresh => this.set(key, fresh))
          .catch(err => console.error(`[cache] SWR refresh failed for ${key}:`, err))
          .finally(() => this.markRefreshing(key, false));
      }
      return state.value;
    }

    const fresh = await this.singleflight(key, factory);
    this.set(key, fresh);
    return fresh;
  }
}
