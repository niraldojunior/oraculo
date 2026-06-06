import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createAllocationsController } from './allocations.controller.js';

interface AllocationsRouterDeps {
  prisma: PrismaClient;
}

export function createAllocationsRouter(deps: AllocationsRouterDeps) {
  const router = Router();
  const controller = createAllocationsController(deps);

  router.get('/api/allocations', controller.getAllocations);

  return router;
}
