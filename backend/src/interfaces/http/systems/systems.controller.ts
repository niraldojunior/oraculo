import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';

interface SystemsControllerDeps {
  prisma: PrismaClient;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
  getCommonWhere: (req: any) => Record<string, string>;
  sanitizeSystem: (data: Record<string, any>) => Record<string, any>;
  ensureCompanyMatchesDept: (data: any) => Promise<any>;
  systemListOmit: any;
}

export function createSystemsController(deps: SystemsControllerDeps) {
  const {
    prisma,
    buildCacheKey,
    serveSWR,
    setCached,
    invalidateCacheByPrefix,
    getCommonWhere,
    sanitizeSystem,
    ensureCompanyMatchesDept,
    systemListOmit
  } = deps;

  const getSystems = async (req: any, res: any) => {
    try {
      const { companyId } = req.query;
      const where = companyId ? { companyId: companyId as string } : getCommonWhere(req);
      const cacheKey = buildCacheKey('systems', where);
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        const systems = await prisma.system.findMany({ where, omit: systemListOmit });
        console.log('Found', systems.length, 'systems', `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, systems);
        return systems;
      }, 'systems');
    } catch (error) {
      console.error('API Error /api/systems [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch systems' });
    }
  };

  const getSystemById = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const system = await prisma.system.findUnique({
        where: { id }
      });
      if (!system) return res.status(404).json({ error: 'System not found' });
      res.json(system);
    } catch (error) {
      console.error('API Error /api/systems/:id [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch system' });
    }
  };

  const createSystem = async (req: any, res: any) => {
    try {
      const data = sanitizeSystem(req.body);
      delete data.id;
      await ensureCompanyMatchesDept(data);

      const system = await prisma.system.create({ data: data as any });
      invalidateCacheByPrefix('systems');
      res.json(system);
    } catch (error: any) {
      console.error('API Error /api/systems [POST]:', error);
      res.status(500).json({ error: 'Failed to create system', details: error.message });
    }
  };

  const updateSystem = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const data = sanitizeSystem(req.body);
      delete data.id;
      await ensureCompanyMatchesDept(data);

      const system = await prisma.system.update({
        where: { id },
        data: data as any
      });
      invalidateCacheByPrefix('systems');
      res.json(system);
    } catch (error: any) {
      console.error('API Error /api/systems/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update system', details: error.message });
    }
  };

  const deleteSystem = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await prisma.system.delete({
        where: { id }
      });
      invalidateCacheByPrefix('systems');
      res.json({ message: 'System deleted' });
    } catch (error: any) {
      console.error('API Error /api/systems/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete system', details: error.message });
    }
  };

  return {
    getSystems,
    getSystemById,
    createSystem,
    updateSystem,
    deleteSystem
  };
}
