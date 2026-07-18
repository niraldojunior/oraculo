import { afterEach, describe, expect, it } from '@jest/globals';
import { resolveDbProvider } from '../../config/env.config.js';

describe('resolveDbProvider', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDbProvider = process.env.DB_PROVIDER;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalDbProvider === undefined) {
      delete process.env.DB_PROVIDER;
    } else {
      process.env.DB_PROVIDER = originalDbProvider;
    }
  });

  it('forces Supabase in production even when DB_PROVIDER is oracle', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_PROVIDER = 'oracle';

    expect(resolveDbProvider()).toBe('supabase');
  });

  it('uses Oracle by default outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DB_PROVIDER;

    expect(resolveDbProvider()).toBe('oracle');
  });

  it('respects DB_PROVIDER outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.DB_PROVIDER = 'inmemory';

    expect(resolveDbProvider()).toBe('inmemory');
  });
});
