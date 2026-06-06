import type { CompanyRepository, CompanyWriteData } from '../domain/repositories/CompanyRepository.js';

export class CompanyApplicationService {
  private readonly repository: CompanyRepository;

  constructor(repository: CompanyRepository) {
    this.repository = repository;
  }

  async listCompanies(companyListOmit: any) {
    return this.repository.listCompanies(companyListOmit);
  }

  async createCompany(data: CompanyWriteData) {
    return this.repository.createCompany(data);
  }

  async updateCompany(id: string, data: CompanyWriteData) {
    return this.repository.updateCompany(id, data);
  }

  async deleteCompany(id: string) {
    await this.repository.deleteCompany(id);
  }
}