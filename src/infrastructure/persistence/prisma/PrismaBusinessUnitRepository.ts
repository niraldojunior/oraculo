import type { PrismaClient } from '@prisma/client';
import type { BusinessUnit, BusinessUnitWriteData } from '../../../domain/entities/BusinessUnit.js';
import type { BusinessUnitRepository } from '../../../domain/repositories/BusinessUnitRepository.js';

export class PrismaBusinessUnitRepository implements BusinessUnitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listBusinessUnits(scope: { companyId?: string; departmentId?: string }): Promise<BusinessUnit[]> {
    return this.prisma.businessUnit.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        departmentId: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async createBusinessUnit(data: BusinessUnitWriteData): Promise<BusinessUnit> {
    return this.prisma.businessUnit.create({
      data: {
        name: data.name ?? '',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? ''
      },
      select: { id: true, name: true, companyId: true, departmentId: true }
    });
  }

  async updateBusinessUnit(id: string, data: BusinessUnitWriteData): Promise<BusinessUnit> {
    return this.prisma.businessUnit.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {})
      },
      select: { id: true, name: true, companyId: true, departmentId: true }
    });
  }

  async deleteBusinessUnit(id: string): Promise<void> {
    await this.prisma.clientTeam.updateMany({
      where: { businessUnitId: id },
      data: { businessUnitId: null }
    });
    await this.prisma.businessUnit.delete({ where: { id } });
  }
}
