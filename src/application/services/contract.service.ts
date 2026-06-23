import { Inject, Injectable } from '@nestjs/common';
import type { Contract, ContractWriteData } from '../../domain/entities/Contract.js';
import { CONTRACT_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { ContractRepository } from '../../domain/repositories/ContractRepository.js';

@Injectable()
export class ContractService {
  constructor(
    @Inject(CONTRACT_REPOSITORY)
    private readonly repository: ContractRepository
  ) {}

  listContracts(scope: { companyId?: string; departmentId?: string }): Promise<Contract[]> {
    return this.repository.listContracts(scope);
  }

  createContract(data: ContractWriteData): Promise<Contract> {
    return this.repository.createContract(data);
  }

  updateContract(id: string, data: ContractWriteData): Promise<Contract> {
    return this.repository.updateContract(id, data);
  }

  deleteContract(id: string): Promise<void> {
    return this.repository.deleteContract(id);
  }
}
