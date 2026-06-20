import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';
import { createAllocationsController } from './allocations.controller.js';

interface AllocationsRouterDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
}

export function createAllocationsRouter(deps: AllocationsRouterDeps) {
  const router = Router();
  const controller = createAllocationsController(deps);

  router.get('/api/allocations', controller.getAllocations);

  return router;
}
