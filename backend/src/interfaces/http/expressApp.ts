// ================== APP.TS STARTING ==================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { createDatabaseRuntime } from '../../infrastructure/persistence/database.runtime.js';
import { createScopeHelpers } from './shared/scope.helpers.js';
import { createApiCacheHelpers, createImageCacheHelpers } from './shared/cache.helpers.js';
import { createImageServingHelpers } from './shared/image-serving.helpers.js';
import { registerHttpRoutes } from './http.routes.js';

process.stderr.write('\n=== APP.TS CODE IS EXECUTING ===\n');

console.log('[app.ts] Module loading...');

// Carregar .env.local primeiro, depois .env, depois usar values padrão
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const databaseRuntime = createDatabaseRuntime();
const prisma = databaseRuntime.prisma;
const app = express();

// Stale-While-Revalidate:
//   staleAt   = ponto em que o cache passa a ser servido como "stale" e dispara refresh em background.
//   expiresAt = ponto em que o cache é descartado e a próxima request paga o custo total de DB.
// Como POST/PATCH/DELETE já invalidam o cache, podemos ser generosos no TTL.
const API_CACHE_STALE_MS = Number(process.env.API_CACHE_STALE_MS || 60000);
const API_CACHE_TTL_MS = Number(process.env.API_CACHE_TTL_MS || 300000);
const IMAGE_CACHE_TTL_MS = Number(process.env.IMAGE_CACHE_TTL_MS || 300000);

const AGGREGATE_PREFIXES = ['inventory-context', 'vendors-context'];
const AGGREGATE_DEPENDENCIES = [
  'systems', 'teams', 'collaborators', 'vendors', 'departments', 'companies'
];

const {
  buildCacheKey,
  getCachedState,
  isRefreshing,
  markRefreshing,
  setCached,
  singleflight,
  serveSWR,
  invalidateCacheByPrefix
} = createApiCacheHelpers({
  staleMs: API_CACHE_STALE_MS,
  ttlMs: API_CACHE_TTL_MS,
  aggregatePrefixes: AGGREGATE_PREFIXES,
  aggregateDependencies: AGGREGATE_DEPENDENCIES
});

const {
  getCachedImage,
  setCachedImage,
  invalidateImageCacheByPrefix
} = createImageCacheHelpers(IMAGE_CACHE_TTL_MS);

const { serveEntityImage } = createImageServingHelpers({
  getCachedImage,
  setCachedImage
});

void databaseRuntime.start();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const { ensureCompanyMatchesDept, getCommonWhere } = prisma
  ? createScopeHelpers(prisma)
  : {
      ensureCompanyMatchesDept: async (data: any) => data,
      getCommonWhere: (req: any) => {
        const { companyId, departmentId } = req.query || {};
        const where: any = {};
        if (companyId) where.companyId = companyId as string;
        if (departmentId) where.departmentId = departmentId as string;
        return where;
      }
    };

registerHttpRoutes(app, {
  provider: databaseRuntime.provider,
  prisma,
  oracle: databaseRuntime.oracle,
  buildCacheKey,
  getCachedState,
  isRefreshing,
  markRefreshing,
  setCached,
  singleflight,
  serveSWR,
  invalidateCacheByPrefix,
  invalidateImageCacheByPrefix,
  serveEntityImage,
  ensureCompanyMatchesDept,
  getCommonWhere
});

export default app;

