import type { PrismaClient } from '@prisma/client';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';

interface AllocationsControllerDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
}

export function createAllocationsController(deps: AllocationsControllerDeps) {
  const { prisma, oracle, provider } = deps;

  const getAllocations = async (_req: any, res: any) => {
    try {
      if (prisma) {
        const allocations = await prisma.allocation.findMany();
        return res.json(allocations);
      }

      if (!oracle) {
        return res.status(501).json({ error: `Allocations are not implemented for DB_PROVIDER=${provider}` });
      }

      const allocations = await oracle.query<Record<string, unknown>>(`
        SELECT
          "id",
          "companyId",
          "departmentId",
          "collaboratorId",
          "initiativeId",
          "systemId",
          "percentage",
          "startDate",
          "endDate"
        FROM "Allocation"
      `);
      res.json(allocations);
    } catch (error) {
      console.error('API Error /api/allocations [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch allocations' });
    }
  };

  return {
    getAllocations
  };
}
