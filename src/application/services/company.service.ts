import { Inject, Injectable } from '@nestjs/common';
import type { Company, CompanyWriteData } from '../../domain/entities/Company.js';
import { COMPANY_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { CompanyRepository } from '../../domain/repositories/CompanyRepository.js';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly repository: CompanyRepository
  ) {}

  listCompanies(): Promise<Company[]> {
    return this.repository.listCompanies();
  }

  createCompany(data: CompanyWriteData): Promise<Company> {
    return this.repository.createCompany(this.sanitizeCompany(data));
  }

  updateCompany(id: string, data: CompanyWriteData): Promise<Company> {
    return this.repository.updateCompany(id, this.sanitizeCompany(data));
  }

  deleteCompany(id: string): Promise<void> {
    return this.repository.deleteCompany(id);
  }

  private sanitizeCompany(data: CompanyWriteData): CompanyWriteData {
    const clean = { ...data };
    if (typeof clean.logo === 'string' && clean.logo.startsWith('/api/_img/')) {
      delete clean.logo;
    }
    return clean;
  }
}
