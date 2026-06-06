import type { PrismaClient } from '@prisma/client';
import type { CompanyRepository, CompanyWriteData } from '../../domain/repositories/CompanyRepository.js';

export class PrismaCompanyRepository implements CompanyRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listCompanies(companyListOmit: any): Promise<any[]> {
    return this.prisma.company.findMany({ omit: companyListOmit });
  }

  async createCompany(data: CompanyWriteData): Promise<any> {
    return this.prisma.company.create({ data: data as any });
  }

  async updateCompany(id: string, data: CompanyWriteData): Promise<any> {
    return this.prisma.company.update({
      where: { id },
      data: data as any
    });
  }

  async deleteCompany(id: string): Promise<void> {
    await this.prisma.company.delete({ where: { id } });
  }
}