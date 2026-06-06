import type { Response } from 'express';
import type { CompanyApplicationService } from '../../../application/CompanyApplicationService.js';

interface CompaniesControllerDeps {
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

export function createCompaniesController(deps: CompaniesControllerDeps) {
  const {
    companyService,
    buildCacheKey,
    serveSWR,
    setCached,
    invalidateCacheByPrefix,
    invalidateImageCacheByPrefix,
    optimizeFieldInPlace,
    sanitizeCompany,
    transformCompanyImage,
    companyListOmit
  } = deps;

  const getCompanies = async (_req: any, res: any) => {
    try {
      const cacheKey = buildCacheKey('companies');
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        const companies = (await companyService.listCompanies(companyListOmit)).map(transformCompanyImage);
        console.log('Found', companies.length, 'companies', `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, companies);
        return companies;
      }, 'companies');
    } catch (error) {
      console.error('API Error /api/companies [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  };

  const createCompany = async (req: any, res: any) => {
    try {
      const body = sanitizeCompany(req.body);
      await optimizeFieldInPlace(body, 'logo', 'logo');
      const company = await companyService.createCompany(body);
      invalidateImageCacheByPrefix(`img:company:${company.id}`);
      invalidateCacheByPrefix('companies');
      invalidateCacheByPrefix('departments');
      invalidateCacheByPrefix('teams');
      invalidateCacheByPrefix('collaborators');
      res.json(company);
    } catch (error) {
      console.error('API Error /api/companies [POST]:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  };

  const updateCompany = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const body = sanitizeCompany(req.body);
      await optimizeFieldInPlace(body, 'logo', 'logo');
      const company = await companyService.updateCompany(id, body);
      invalidateImageCacheByPrefix(`img:company:${id}`);
      invalidateCacheByPrefix('companies');
      invalidateCacheByPrefix('departments');
      invalidateCacheByPrefix('teams');
      invalidateCacheByPrefix('collaborators');
      res.json(company);
    } catch (error) {
      console.error('API Error /api/companies/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  };

  const deleteCompany = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await companyService.deleteCompany(id);
      invalidateImageCacheByPrefix(`img:company:${id}`);
      invalidateCacheByPrefix('companies');
      invalidateCacheByPrefix('departments');
      invalidateCacheByPrefix('teams');
      invalidateCacheByPrefix('collaborators');
      res.json({ message: 'Company deleted' });
    } catch (error) {
      console.error('API Error /api/companies/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete company' });
    }
  };

  return {
    getCompanies,
    createCompany,
    updateCompany,
    deleteCompany
  };
}
