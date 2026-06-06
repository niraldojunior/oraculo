import type { Company, CompanyWriteData } from '../models/Company.js';

export type { CompanyWriteData };

export interface CompanyRepository {
  listCompanies(companyListOmit: unknown): Promise<Company[]>;
  createCompany(data: CompanyWriteData): Promise<Company>;
  updateCompany(id: string, data: CompanyWriteData): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
}