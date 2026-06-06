import { Router } from 'express';
import type { Response } from 'express';
import type { CompanyApplicationService } from '../../../application/CompanyApplicationService.js';
import { createCompaniesController } from './companies.controller.js';

interface CompaniesRouterDeps {
  companyService: CompanyApplicationService;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
  invalidateImageCacheByPrefix: (prefix: string) => void;
  optimizeFieldInPlace: (obj: any, field: string, kind: any) => Promise<any>;
  sanitizeCompany: (data: Record<string, any>) => Record<string, any>;
  transformCompanyImage: <T extends { id: string; logo?: string | null }>(c: T) => T;
  companyListOmit: any;
}

export function createCompaniesRouter(deps: CompaniesRouterDeps) {
  const router = Router();
  const controller = createCompaniesController(deps);

  router.get('/api/companies', controller.getCompanies);
  router.post('/api/companies', controller.createCompany);
  router.patch('/api/companies/:id', controller.updateCompany);
  router.delete('/api/companies/:id', controller.deleteCompany);

  return router;
}
