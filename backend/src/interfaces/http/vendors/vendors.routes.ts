import { Router } from 'express';
import type { Response } from 'express';
import type { VendorApplicationService } from '../../../application/VendorApplicationService.js';
import { createVendorsController } from './vendors.controller.js';

interface VendorsRouterDeps {
  vendorService: VendorApplicationService;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  setCached: (key: string, value: unknown) => void;
  getCommonWhere: (req: any) => Record<string, string>;
  sanitizeVendor: (data: Record<string, any>) => Record<string, any>;
  ensureCompanyMatchesDept: (data: any) => Promise<any>;
  optimizeFieldInPlace: (obj: any, field: string, kind: any) => Promise<any>;
  invalidateImageCacheByPrefix: (prefix: string) => void;
  transformVendorImage: <T extends { id: string; logoUrl?: string | null }>(v: T) => T;
  transformCollaboratorImage: <T extends { id: string; photoUrl?: string | null }>(c: T) => T;
  transformCompanyImage: <T extends { id: string; logo?: string | null }>(c: T) => T;
  collaboratorSafeSelect: any;
  vendorListOmit: any;
  systemListOmit: any;
  companyListOmit: any;
  vendorLiteSelect: any;
}

export function createVendorsRouter(deps: VendorsRouterDeps) {
  const router = Router();
  const controller = createVendorsController(deps);

  router.get('/api/vendors', controller.getVendors);
  router.get('/api/vendors-context', controller.getVendorsContext);
  router.post('/api/vendors', controller.createVendor);
  router.patch('/api/vendors/:id', controller.updateVendor);
  router.delete('/api/vendors/:id', controller.deleteVendor);

  return router;
}
