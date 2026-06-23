import type { Company, CompanyWriteData } from '../entities/Company.js';

export interface CompanyRepository {
  listCompanies(): Promise<Company[]>;
  createCompany(data: CompanyWriteData): Promise<Company>;
  updateCompany(id: string, data: CompanyWriteData): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
}
