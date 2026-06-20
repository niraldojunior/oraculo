import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';
import { createCoreController } from './core.controller.js';

interface CoreRouterDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
}

export function createCoreRouter(deps: CoreRouterDeps) {
  const router = Router();
  const controller = createCoreController(deps);

  router.get('/api/health', controller.getHealth);
  router.post('/api/auth/login', controller.login);

  return router;
}
