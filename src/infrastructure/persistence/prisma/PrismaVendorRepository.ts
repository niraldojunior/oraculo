import type { PrismaClient } from '@prisma/client';
import type { Vendor, VendorContext, VendorWriteData } from '../../../domain/entities/Vendor.js';
import type { VendorRepository } from '../../../domain/repositories/VendorRepository.js';

export class PrismaVendorRepository implements VendorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listVendors(scope: { companyId?: string; departmentId?: string }): Promise<Vendor[]> {
    return this.prisma.vendor.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      },
      orderBy: { companyName: 'asc' }
    });
  }

  async getVendorsContext(scope: { companyId?: string; departmentId?: string }): Promise<VendorContext> {
    const companyWhere = scope.companyId ? { id: scope.companyId } : {};
    const departmentWhere = scope.companyId ? { companyId: scope.companyId } : {};

    const [vendors, contracts, systems, collaborators, companies, departments] = await Promise.all([
      this.prisma.vendor.findMany({
        where: {
          ...(scope.companyId ? { companyId: scope.companyId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
        },
        include: { contracts: true },
        orderBy: { companyName: 'asc' }
      }),
      this.prisma.contract.findMany({
        where: {
          ...(scope.companyId ? { companyId: scope.companyId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
        }
      }),
      this.prisma.system.findMany({
        where: {
          ...(scope.companyId ? { companyId: scope.companyId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
        }
      }),
      this.prisma.collaborator.findMany({
        where: {
          ...(scope.companyId ? { companyId: scope.companyId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          photoUrl: true,
          companyId: true,
          departmentId: true
        }
      }),
      this.prisma.company.findMany({ where: companyWhere }),
      this.prisma.department.findMany({ where: departmentWhere })
    ]);

    return {
      vendors,
      contracts,
      systems,
      collaborators,
      companies,
      departments
    };
  }

  async createVendor(data: VendorWriteData): Promise<Vendor> {
    return this.prisma.vendor.create({
      data: {
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        companyName: data.companyName ?? '',
        taxId: data.taxId ?? '',
        type: data.type ?? '',
        logoUrl: data.logoUrl ?? null,
        directorId: data.directorId ?? null,
        managerId: data.managerId ?? null
      }
    });
  }

  async updateVendor(id: string, data: VendorWriteData): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data: {
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.companyName !== undefined ? { companyName: data.companyName } : {}),
        ...(data.taxId !== undefined ? { taxId: data.taxId } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.directorId !== undefined ? { directorId: data.directorId } : {}),
        ...(data.managerId !== undefined ? { managerId: data.managerId } : {})
      }
    });
  }

  async deleteVendor(id: string): Promise<void> {
    await this.prisma.vendor.delete({ where: { id } });
  }
}
