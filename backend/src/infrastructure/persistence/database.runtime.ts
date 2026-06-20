import type { PrismaClient } from '@prisma/client';
import {
  createPrismaRuntime,
  startPrismaRuntime,
  type PrismaRuntimeConfig
} from './prisma.runtime.js';
import { createOracleRuntime, type OracleRuntime } from './oracle.runtime.js';

export type DatabaseProvider = 'supabase' | 'oracle';

export interface DatabaseRuntime {
  provider: DatabaseProvider;
  prisma: PrismaClient | null;
  start: () => Promise<void>;
  oracle: OracleRuntime | null;
}

function readDatabaseProvider(): DatabaseProvider {
  const raw = (process.env.DB_PROVIDER || 'supabase').trim().toLowerCase();

  if (raw === 'supabase' || raw === 'postgres' || raw === 'postgresql') {
    return 'supabase';
  }

  if (raw === 'oracle') {
    return 'oracle';
  }

  throw new Error(`[database] Invalid DB_PROVIDER="${raw}". Supported values: supabase, oracle`);
}

function createSupabaseRuntime() {
  const { prisma, config } = createPrismaRuntime();

  return {
    provider: 'supabase' as const,
    prisma,
    config,
    start: async () => {
      await startPrismaRuntime(prisma, config);
    }
  };
}

export function createDatabaseRuntime(): DatabaseRuntime {
  const provider = readDatabaseProvider();

  if (provider === 'supabase') {
    const runtime = createSupabaseRuntime();
    return {
      provider,
      prisma: runtime.prisma,
      oracle: null,
      start: runtime.start
    };
  }

  const oracle = createOracleRuntime();
  return {
    provider,
    prisma: null,
    oracle,
    start: async () => {
      await oracle.start();
    }
  };
}

export type { PrismaRuntimeConfig };