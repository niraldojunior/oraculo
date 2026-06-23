import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Company, CompanyWriteData } from '../../../domain/entities/Company.js';
import type { CompanyRepository } from '../../../domain/repositories/CompanyRepository.js';

@Injectable()
export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly companies = new Map<string, Company>();

  async listCompanies(): Promise<Company[]> {
    return [...this.companies.values()];
  }

  async createCompany(data: CompanyWriteData): Promise<Company> {
    const created: Company = {
      id: randomUUID(),
      fantasyName: data.fantasyName ?? '',
      realName: data.realName ?? '',
      logo: data.logo ?? '',
      description: data.description ?? ''
    };
    this.companies.set(created.id, created);
    return created;
  }

  async updateCompany(id: string, data: CompanyWriteData): Promise<Company> {
    const current = this.companies.get(id);
    if (!current) {
      throw new Error('Company not found');
    }

    const updated: Company = {
      ...current,
      ...data
    };
    this.companies.set(id, updated);
    return updated;
  }

  async deleteCompany(id: string): Promise<void> {
    this.companies.delete(id);
  }
}
