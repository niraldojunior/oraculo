import type { PrismaClient } from '@prisma/client';
import type { VendorRepository, VendorWriteData } from '../../domain/repositories/VendorRepository.js';

export class PrismaVendorRepository implements VendorRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listVendors(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    vendorLiteSelect: any;
    vendorListOmit: any;
  }): Promise<any[]> {
    const { scope, lite, vendorLiteSelect, vendorListOmit } = params;
    if (lite) {
      return this.prisma.vendor.findMany({
        where: scope,
        orderBy: { companyName: 'asc' },
        select: vendorLiteSelect
      });
    }

    return this.prisma.vendor.findMany({
      where: scope,
      orderBy: { companyName: 'asc' },
      omit: vendorListOmit
    });
  }

  async getVendorsContext(params: {
    scope: { companyId?: string; departmentId?: string };
    collaboratorSafeSelect: any;
    vendorListOmit: any;
    systemListOmit: any;
    companyListOmit: any;
  }): Promise<{
    vendors: any[];
    contracts: any[];
    systems: any[];
    collaborators: any[];
    companies: any[];
    departments: any[];
  }> {
    const { scope, collaboratorSafeSelect, vendorListOmit, systemListOmit, companyListOmit } = params;
    const companyWhere = scope.companyId ? { id: scope.companyId } : {};
    const deptWhere = scope.companyId ? { companyId: scope.companyId } : {};

    const [vendors, contracts, systems, collaborators, companies, departments] = await Promise.all([
      this.prisma.vendor.findMany({
        where: scope,
        omit: vendorListOmit,
        include: { contracts: true, systems: { omit: systemListOmit } },
        orderBy: { companyName: 'asc' }
      }),
      this.prisma.contract.findMany({ where: scope }),
      this.prisma.system.findMany({ where: scope, omit: systemListOmit }),
      this.prisma.collaborator.findMany({ where: scope, select: collaboratorSafeSelect }),
      this.prisma.company.findMany({ where: companyWhere, omit: companyListOmit }),
      this.prisma.department.findMany({ where: deptWhere })
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

  async createVendor(data: VendorWriteData): Promise<any> {
    return this.prisma.vendor.create({ data: data as any });
  }

  async updateVendor(id: string, data: VendorWriteData): Promise<any> {
    return this.prisma.vendor.update({
      where: { id },
      data: data as any
    });
  }

  async deleteVendor(id: string): Promise<void> {
    await this.prisma.vendor.delete({ where: { id } });
  }
}