import type { PrismaClient } from '@prisma/client';
import type { InventoryContext, InventoryScope } from '../../../domain/entities/Inventory.js';
import type { InventoryRepository } from '../../../domain/repositories/InventoryRepository.js';

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getInventoryContext(scope: InventoryScope): Promise<InventoryContext> {
    const where = {
      ...(scope.companyId ? { companyId: scope.companyId } : {}),
      ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
    };

    const departmentWhere = scope.companyId
      ? { companyId: scope.companyId }
      : undefined;

    const [systems, teams, collaborators, vendors, departments] = await Promise.all([
      this.prisma.system.findMany({ where }),
      this.prisma.team.findMany({ where }),
      this.prisma.collaborator.findMany({
        where,
        select: {
          id: true,
          companyId: true,
          departmentId: true,
          name: true,
          email: true,
          role: true,
          squadId: true,
          photoUrl: true,
          phone: true,
          bio: true,
          linkedinUrl: true,
          githubUrl: true,
          isAdmin: true,
          vacationStart: true,
          startDate: true,
          endDate: true,
          birthday: true,
          uf: true,
          associatedCompanyIds: true
        }
      }),
      this.prisma.vendor.findMany({ where }),
      this.prisma.department.findMany({ where: departmentWhere })
    ]);

    return {
      systems: systems as InventoryContext['systems'],
      teams: teams as InventoryContext['teams'],
      collaborators: collaborators as InventoryContext['collaborators'],
      vendors: vendors as InventoryContext['vendors'],
      departments: departments as InventoryContext['departments']
    };
  }
}
