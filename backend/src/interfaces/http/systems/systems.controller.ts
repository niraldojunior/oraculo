import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';

interface SystemsControllerDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
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
    oracle,
    provider,
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
        let systems: any[] = [];

        if (prisma) {
          systems = await prisma.system.findMany({ where, omit: systemListOmit });
        } else {
          if (!oracle) {
            throw new Error(`Systems are not implemented for DB_PROVIDER=${provider}`);
          }

          systems = await oracle.query<Record<string, unknown>>(
            `
              SELECT
                "id",
                "companyId",
                "departmentId",
                "name",
                "category",
                "criticality",
                "ownerTeamId",
                "lifecycleStatus",
                "debtScore",
                "description",
                "environments",
                "technicalSkills",
                "responsibleCollaborators"
              FROM "System"
              WHERE (:companyId IS NULL OR "companyId" = :companyId)
                AND (:departmentId IS NULL OR "departmentId" = :departmentId)
            `,
            {
              companyId: (where as any).companyId ?? null,
              departmentId: (where as any).departmentId ?? null
            }
          );
        }

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
      let system: any = null;

      if (prisma) {
        system = await prisma.system.findUnique({
          where: { id }
        });
      } else {
        if (!oracle) {
          return res.status(501).json({ error: `Systems are not implemented for DB_PROVIDER=${provider}` });
        }

        const rows = await oracle.query<Record<string, unknown>>(
          `
            SELECT
              "id",
              "companyId",
              "departmentId",
              "name",
              "category",
              "criticality",
              "ownerTeamId",
              "lifecycleStatus",
              "debtScore",
              "description",
              "environments",
              "technicalSkills",
              "responsibleCollaborators"
            FROM "System"
            WHERE "id" = :id
          `,
          { id }
        );
        system = rows[0] ?? null;
      }

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

      let system: any = null;

      if (prisma) {
        system = await prisma.system.create({ data: data as any });
      } else {
        if (!oracle) {
          return res.status(501).json({ error: `Systems are not implemented for DB_PROVIDER=${provider}` });
        }

        const id = randomUUID();
        const raw = data as Record<string, unknown>;

        await oracle.execute(
          `
            INSERT INTO "System" (
              "id",
              "companyId",
              "departmentId",
              "name",
              "category",
              "criticality",
              "ownerTeamId",
              "lifecycleStatus",
              "debtScore",
              "description",
              "environments",
              "technicalSkills",
              "responsibleCollaborators"
            ) VALUES (
              :id,
              :companyId,
              :departmentId,
              :name,
              :category,
              :criticality,
              :ownerTeamId,
              :lifecycleStatus,
              :debtScore,
              :description,
              :environments,
              :technicalSkills,
              :responsibleCollaborators
            )
          `,
          {
            id,
            companyId: raw.companyId,
            departmentId: raw.departmentId,
            name: raw.name,
            category: raw.category ?? null,
            criticality: raw.criticality,
            ownerTeamId: raw.ownerTeamId ?? null,
            lifecycleStatus: raw.lifecycleStatus,
            debtScore: raw.debtScore ?? 0,
            description: raw.description,
            environments: raw.environments ? JSON.stringify(raw.environments) : null,
            technicalSkills: raw.technicalSkills ? JSON.stringify(raw.technicalSkills) : null,
            responsibleCollaborators: raw.responsibleCollaborators
              ? JSON.stringify(raw.responsibleCollaborators)
              : null
          }
        );

        const rows = await oracle.query<Record<string, unknown>>(
          `
            SELECT
              "id",
              "companyId",
              "departmentId",
              "name",
              "category",
              "criticality",
              "ownerTeamId",
              "lifecycleStatus",
              "debtScore",
              "description",
              "environments",
              "technicalSkills",
              "responsibleCollaborators"
            FROM "System"
            WHERE "id" = :id
          `,
          { id }
        );

        system = rows[0] ?? null;
      }

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

      let system: any = null;

      if (prisma) {
        system = await prisma.system.update({
          where: { id },
          data: data as any
        });
      } else {
        if (!oracle) {
          return res.status(501).json({ error: `Systems are not implemented for DB_PROVIDER=${provider}` });
        }

        const raw = data as Record<string, unknown>;
        const fields: string[] = [];
        const binds: Record<string, unknown> = { id };

        const assignField = (field: string, key: string, value: unknown) => {
          if (value !== undefined) {
            fields.push(`"${field}" = :${key}`);
            binds[key] = value;
          }
        };

        assignField('companyId', 'companyId', raw.companyId);
        assignField('departmentId', 'departmentId', raw.departmentId);
        assignField('name', 'name', raw.name);
        assignField('category', 'category', raw.category);
        assignField('criticality', 'criticality', raw.criticality);
        assignField('ownerTeamId', 'ownerTeamId', raw.ownerTeamId);
        assignField('lifecycleStatus', 'lifecycleStatus', raw.lifecycleStatus);
        assignField('debtScore', 'debtScore', raw.debtScore);
        assignField('description', 'description', raw.description);
        assignField('environments', 'environments', raw.environments ? JSON.stringify(raw.environments) : raw.environments);
        assignField('technicalSkills', 'technicalSkills', raw.technicalSkills ? JSON.stringify(raw.technicalSkills) : raw.technicalSkills);
        assignField(
          'responsibleCollaborators',
          'responsibleCollaborators',
          raw.responsibleCollaborators ? JSON.stringify(raw.responsibleCollaborators) : raw.responsibleCollaborators
        );

        if (fields.length > 0) {
          await oracle.execute(
            `
              UPDATE "System"
              SET ${fields.join(', ')}
              WHERE "id" = :id
            `,
            binds
          );
        }

        const rows = await oracle.query<Record<string, unknown>>(
          `
            SELECT
              "id",
              "companyId",
              "departmentId",
              "name",
              "category",
              "criticality",
              "ownerTeamId",
              "lifecycleStatus",
              "debtScore",
              "description",
              "environments",
              "technicalSkills",
              "responsibleCollaborators"
            FROM "System"
            WHERE "id" = :id
          `,
          { id }
        );

        system = rows[0] ?? null;
      }

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
      if (prisma) {
        await prisma.system.delete({
          where: { id }
        });
      } else {
        if (!oracle) {
          return res.status(501).json({ error: `Systems are not implemented for DB_PROVIDER=${provider}` });
        }

        await oracle.execute('DELETE FROM "System" WHERE "id" = :id', { id });
      }

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
