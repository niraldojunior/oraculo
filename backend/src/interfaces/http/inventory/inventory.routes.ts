import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import { createInventoryController } from './inventory.controller.js';

interface InventoryRouterDeps {
  prisma: PrismaClient;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  setCached: (key: string, value: unknown) => void;
  getCommonWhere: (req: any) => Record<string, string>;
  systemListOmit: any;
  vendorListOmit: any;
  collaboratorSafeSelect: any;
  transformCollaboratorImage: <T extends { id: string; photoUrl?: string | null }>(c: T) => T;
  transformVendorImage: <T extends { id: string; logoUrl?: string | null }>(v: T) => T;
}

export function createInventoryRouter(deps: InventoryRouterDeps) {
  const router = Router();
  const controller = createInventoryController(deps);

  router.get('/api/inventory-context', controller.getInventoryContext);

  return router;
}
