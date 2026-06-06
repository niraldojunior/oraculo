import type { ContractRepository, ContractWriteData } from '../domain/repositories/ContractRepository.js';

export class ContractApplicationService {
  private readonly repository: ContractRepository;

  constructor(repository: ContractRepository) {
    this.repository = repository;
  }

  async listContracts(scope: { companyId?: string; departmentId?: string }) {
    return this.repository.listContracts(scope);
  }

  async createContract(data: ContractWriteData) {
    return this.repository.createContract(data);
  }

  async updateContract(id: string, data: ContractWriteData) {
    return this.repository.updateContract(id, data);
  }

  async deleteContract(id: string) {
    await this.repository.deleteContract(id);
  }
}