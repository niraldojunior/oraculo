import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';
import { createSystemsController } from './systems.controller.js';

interface SystemsRouterDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
  getCommonWhere: (req: any) => Record<string, string>;
  sanitizeSystem: (data: Record<string, any>) => Record<string, any>;
  ensureCompanyMatchesDept: (data: any) => Promise<any>;
  systemListOmit: any;
}

export function createSystemsRouter(deps: SystemsRouterDeps) {
  const router = Router();
  const controller = createSystemsController(deps);

  router.get('/api/systems', controller.getSystems);
  router.get('/api/systems/:id', controller.getSystemById);
  router.post('/api/systems', controller.createSystem);
  router.patch('/api/systems/:id', controller.updateSystem);
  router.delete('/api/systems/:id', controller.deleteSystem);

  return router;
}
