import type { Contract, ContractWriteData } from '../models/Contract.js';

export type { ContractWriteData };

export interface ContractRepository {
  listContracts(scope: { companyId?: string; departmentId?: string }): Promise<Contract[]>;
  createContract(data: ContractWriteData): Promise<Contract>;
  updateContract(id: string, data: ContractWriteData): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
}