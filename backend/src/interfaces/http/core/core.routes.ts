import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createCoreController } from './core.controller.js';

interface CoreRouterDeps {
  prisma: PrismaClient;
}

export function createCoreRouter(deps: CoreRouterDeps) {
  const router = Router();
  const controller = createCoreController(deps);

  router.get('/api/health', controller.getHealth);
  router.post('/api/auth/login', controller.login);

  return router;
}
