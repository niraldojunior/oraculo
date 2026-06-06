import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';

interface InventoryControllerDeps {
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

export function createInventoryController(deps: InventoryControllerDeps) {
  const {
    prisma,
    buildCacheKey,
    serveSWR,
    setCached,
    getCommonWhere,
    systemListOmit,
    vendorListOmit,
    collaboratorSafeSelect,
    transformCollaboratorImage,
    transformVendorImage
  } = deps;

  const getInventoryContext = async (req: any, res: any) => {
    try {
      const where = getCommonWhere(req);
      const { companyId } = req.query;
      const cacheKey = buildCacheKey('inventory-context', { ...where, companyId: companyId ?? null });
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        const [systems, teams, collaborators, vendors, departments] = await Promise.all([
          prisma.system.findMany({ where, omit: systemListOmit }),
          prisma.team.findMany({ where }),
          prisma.collaborator.findMany({ where, select: collaboratorSafeSelect }),
          prisma.vendor.findMany({ where, omit: vendorListOmit }),
          prisma.department.findMany({ where: companyId ? { companyId: companyId as string } : undefined })
        ]);
        const payload = {
          systems,
          teams,
          collaborators: collaborators.map(c => transformCollaboratorImage(c as any)),
          vendors: vendors.map(v => transformVendorImage(v as any)),
          departments
        };
        console.log('inventory-context built', `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, payload);
        return payload;
      }, 'inventory-context');
    } catch (error) {
      console.error('API Error /api/inventory-context [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch inventory context' });
    }
  };

  return {
    getInventoryContext
  };
}
