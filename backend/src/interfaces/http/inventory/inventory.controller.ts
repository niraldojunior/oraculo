import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';

interface InventoryControllerDeps {
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
    oracle,
    provider,
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
        let systems: any[] = [];
        let teams: any[] = [];
        let collaborators: any[] = [];
        let vendors: any[] = [];
        let departments: any[] = [];

        if (prisma) {
          [systems, teams, collaborators, vendors, departments] = await Promise.all([
            prisma.system.findMany({ where, omit: systemListOmit }),
            prisma.team.findMany({ where }),
            prisma.collaborator.findMany({ where, select: collaboratorSafeSelect }),
            prisma.vendor.findMany({ where, omit: vendorListOmit }),
            prisma.department.findMany({ where: companyId ? { companyId: companyId as string } : undefined })
          ]);
        } else {
          if (!oracle) {
            throw new Error(`Inventory context is not implemented for DB_PROVIDER=${provider}`);
          }

          const binds = {
            companyId: where.companyId ?? null,
            departmentId: where.departmentId ?? null
          };

          [systems, teams, collaborators, vendors, departments] = await Promise.all([
            oracle.query(
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
              binds
            ),
            oracle.query(
              `
                SELECT
                  "id",
                  "companyId",
                  "departmentId",
                  "name",
                  "type",
                  "parentTeamId",
                  "leaderId",
                  "receivesInitiatives"
                FROM "Team"
                WHERE (:companyId IS NULL OR "companyId" = :companyId)
                  AND (:departmentId IS NULL OR "departmentId" = :departmentId)
              `,
              binds
            ),
            oracle.query(
              `
                SELECT
                  "id",
                  "companyId",
                  "departmentId",
                  "name",
                  "photoUrl",
                  "email",
                  "role",
                  "teamId" AS "squadId",
                  "phone",
                  "bio",
                  "linkedinUrl",
                  "githubUrl",
                  "isAdmin",
                  "associatedCompanyIds",
                  "vacationStart",
                  "startDate",
                  "endDate"
                FROM "Collaborator"
                WHERE (:companyId IS NULL OR "companyId" = :companyId)
                  AND (:departmentId IS NULL OR "departmentId" = :departmentId)
              `,
              binds
            ),
            oracle.query(
              `
                SELECT
                  "id",
                  "companyId",
                  "departmentId",
                  "companyName",
                  "taxId",
                  "type",
                  "directorId",
                  "managerId"
                FROM "Vendor"
                WHERE (:companyId IS NULL OR "companyId" = :companyId)
                  AND (:departmentId IS NULL OR "departmentId" = :departmentId)
              `,
              binds
            ),
            oracle.query(
              `
                SELECT
                  "id",
                  "name",
                  "companyId"
                FROM "Department"
                WHERE (:companyId IS NULL OR "companyId" = :companyId)
              `,
              { companyId: companyId ?? where.companyId ?? null }
            )
          ]);
        }

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
