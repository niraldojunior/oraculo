import type express from 'express';
import type { PrismaClient } from '@prisma/client';

export function createScopeHelpers(prisma: PrismaClient) {
  async function ensureCompanyMatchesDept(data: any) {
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId },
        select: { companyId: true }
      });
      if (dept) {
        if (data.companyId && data.companyId !== dept.companyId) {
          throw new Error('Departamento informado pertence a outra empresa.');
        }
        data.companyId = dept.companyId;
      }
    }
    return data;
  }

  function getCommonWhere(req: express.Request) {
    const { companyId, departmentId } = req.query;
    const where: any = {};
    if (companyId) where.companyId = companyId as string;
    if (departmentId) where.departmentId = departmentId as string;
    return where;
  }

  return {
    ensureCompanyMatchesDept,
    getCommonWhere
  };
}
