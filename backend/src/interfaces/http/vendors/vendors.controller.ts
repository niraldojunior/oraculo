import type { Response } from 'express';
import type { VendorApplicationService } from '../../../application/VendorApplicationService.js';

interface VendorsControllerDeps {
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

export function createVendorsController(deps: VendorsControllerDeps) {
  const {
    vendorService,
    buildCacheKey,
    serveSWR,
    setCached,
    getCommonWhere,
    sanitizeVendor,
    ensureCompanyMatchesDept,
    optimizeFieldInPlace,
    invalidateImageCacheByPrefix,
    transformVendorImage,
    transformCollaboratorImage,
    transformCompanyImage,
    collaboratorSafeSelect,
    vendorListOmit,
    systemListOmit,
    companyListOmit,
    vendorLiteSelect
  } = deps;

  const getVendors = async (req: any, res: any) => {
    try {
      const where = getCommonWhere(req);
      const lite = req.query.lite === 'true';
      console.log('Fetching vendors with filter:', JSON.stringify(where));
      const queryStart = Date.now();
      if (lite) {
        const vendors = await vendorService.listVendors({
          scope: where,
          lite,
          vendorLiteSelect,
          vendorListOmit
        });
        const queryMs = Date.now() - queryStart;
        console.log('Found', vendors.length, 'vendors', `| dbQueryMs=${queryMs}`);
        return res.json(vendors);
      }

      const vendors = await vendorService.listVendors({
        scope: where,
        lite,
        vendorLiteSelect,
        vendorListOmit
      });
      const queryMs = Date.now() - queryStart;
      console.log('Found', vendors.length, 'vendors', `| dbQueryMs=${queryMs}`);
      return res.json(vendors.map(transformVendorImage));
    } catch (error: any) {
      console.error('API Error /api/vendors [GET]:', error?.message || error);
      if (error?.stack) console.error('Stack:', error.stack);
      res.status(500).json({
        error: 'Failed to fetch vendors',
        details: error?.message,
        code: error?.code
      });
    }
  };

  const getVendorsContext = async (req: any, res: any) => {
    try {
      const where = getCommonWhere(req);
      const cacheKey = buildCacheKey('vendors-context', where);
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        const { vendors, contracts, systems, collaborators, companies, departments } = await vendorService.getVendorsContext({
          scope: where,
          collaboratorSafeSelect,
          vendorListOmit,
          systemListOmit,
          companyListOmit
        });
        const payload = {
          vendors: vendors.map(v => transformVendorImage(v as any)),
          contracts,
          systems,
          collaborators: collaborators.map(c => transformCollaboratorImage(c as any)),
          companies: companies.map(c => transformCompanyImage(c as any)),
          departments
        };
        console.log('vendors-context built', `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, payload);
        return payload;
      }, 'vendors-context');
    } catch (error) {
      console.error('API Error /api/vendors-context [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch vendors context' });
    }
  };

  const createVendor = async (req: any, res: any) => {
    try {
      const data = sanitizeVendor(req.body);
      await ensureCompanyMatchesDept(data);
      await optimizeFieldInPlace(data, 'logoUrl', 'logo');
      const vendor = await vendorService.createVendor(data);
      invalidateImageCacheByPrefix(`img:vendor:${vendor.id}`);
      res.json(vendor);
    } catch (error: any) {
      console.error('API Error /api/vendors [POST]:', error);
      res.status(500).json({ error: 'Failed to create vendor', details: error.message });
    }
  };

  const updateVendor = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const data = sanitizeVendor(req.body);
      await ensureCompanyMatchesDept(data);
      await optimizeFieldInPlace(data, 'logoUrl', 'logo');
      const vendor = await vendorService.updateVendor(id, data);
      invalidateImageCacheByPrefix(`img:vendor:${id}`);
      res.json(vendor);
    } catch (error: any) {
      console.error('API Error /api/vendors/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update vendor', details: error.message });
    }
  };

  const deleteVendor = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await vendorService.deleteVendor(id);
      invalidateImageCacheByPrefix(`img:vendor:${id}`);
      res.json({ message: 'Vendor deleted' });
    } catch (error: any) {
      console.error('API Error /api/vendors/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete vendor', details: error.message });
    }
  };

  return {
    getVendors,
    getVendorsContext,
    createVendor,
    updateVendor,
    deleteVendor
  };
}
