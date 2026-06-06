import type { PrismaClient } from '@prisma/client';

interface AllocationsControllerDeps {
  prisma: PrismaClient;
}

export function createAllocationsController(deps: AllocationsControllerDeps) {
  const { prisma } = deps;

  const getAllocations = async (_req: any, res: any) => {
    try {
      const allocations = await prisma.allocation.findMany();
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
