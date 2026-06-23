import type { PrismaClient } from '@prisma/client';
import type { Company, CompanyWriteData } from '../../../domain/entities/Company.js';
import type { CompanyRepository } from '../../../domain/repositories/CompanyRepository.js';

export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToDomain(row: {
    id: string;
    fantasyName: string;
    realName: string;
    logo: string;
    description: string;
  }): Company {
    return {
      id: row.id,
      fantasyName: row.fantasyName,
      realName: row.realName,
      logo: row.logo,
      description: row.description
    };
  }

  async listCompanies(): Promise<Company[]> {
    const rows = await this.prisma.company.findMany({
      select: {
        id: true,
        fantasyName: true,
        realName: true,
        logo: true,
        description: true
      }
    });

    return rows.map(row => this.mapToDomain(row));
  }

  async createCompany(data: CompanyWriteData): Promise<Company> {
    const row = await this.prisma.company.create({
      data: {
        fantasyName: data.fantasyName ?? '',
        realName: data.realName ?? '',
        logo: data.logo ?? '',
        description: data.description ?? ''
      },
      select: {
        id: true,
        fantasyName: true,
        realName: true,
        logo: true,
        description: true
      }
    });

    return this.mapToDomain(row);
  }

  async updateCompany(id: string, data: CompanyWriteData): Promise<Company> {
    const row = await this.prisma.company.update({
      where: { id },
      data: {
        ...(data.fantasyName !== undefined ? { fantasyName: data.fantasyName } : {}),
        ...(data.realName !== undefined ? { realName: data.realName } : {}),
        ...(data.logo !== undefined ? { logo: data.logo } : {}),
        ...(data.description !== undefined ? { description: data.description } : {})
      },
      select: {
        id: true,
        fantasyName: true,
        realName: true,
        logo: true,
        description: true
      }
    });

    return this.mapToDomain(row);
  }

  async deleteCompany(id: string): Promise<void> {
    await this.prisma.company.delete({ where: { id } });
  }
}
