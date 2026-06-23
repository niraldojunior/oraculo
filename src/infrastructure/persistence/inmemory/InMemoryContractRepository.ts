import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Contract, ContractWriteData } from '../../../domain/entities/Contract.js';
import type { ContractRepository } from '../../../domain/repositories/ContractRepository.js';

@Injectable()
export class InMemoryContractRepository implements ContractRepository {
  private readonly contracts = new Map<string, Contract>();

  async listContracts(scope: { companyId?: string; departmentId?: string }): Promise<Contract[]> {
    return [...this.contracts.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async createContract(data: ContractWriteData): Promise<Contract> {
    const created: Contract = {
      id: randomUUID(),
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? '',
      vendorId: data.vendorId ?? '',
      number: data.number ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      model: data.model ?? '',
      annualCost: data.annualCost ?? 0,
      name: data.name ?? null,
      description: data.description ?? null,
      status: data.status ?? 'Ativo',
      systemId: data.systemId ?? null,
      leaderId: data.leaderId ?? null
    };
    this.contracts.set(created.id, created);
    return created;
  }

  async updateContract(id: string, data: ContractWriteData): Promise<Contract> {
    const current = this.contracts.get(id);
    if (!current) {
      throw new Error('Contract not found');
    }

    const updated: Contract = { ...current, ...data };
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: string): Promise<void> {
    this.contracts.delete(id);
  }
}
