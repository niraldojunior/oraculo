import { describe, expect, it, jest } from '@jest/globals';
import { ContractService } from '../application/services/contract.service.js';
import type { ContractRepository } from '../domain/repositories/ContractRepository.js';
import type { ContractWriteData } from '../domain/entities/Contract.js';

describe('ContractService', () => {
  it('lists contracts by scope', async () => {
    const repository: ContractRepository = {
      listContracts: jest.fn(async () => []),
      createContract: jest.fn(async (data: ContractWriteData) => ({
        id: 'k1',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        vendorId: data.vendorId ?? '',
        number: data.number ?? '',
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        model: data.model ?? '',
        annualCost: data.annualCost ?? 0
      })),
      updateContract: jest.fn(async (_id: string, data: ContractWriteData) => ({
        id: 'k1',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        vendorId: data.vendorId ?? '',
        number: data.number ?? '',
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        model: data.model ?? '',
        annualCost: data.annualCost ?? 0
      })),
      deleteContract: jest.fn(async () => undefined)
    };

    const service = new ContractService(repository);
    await service.listContracts({ companyId: 'c1' });

    expect(repository.listContracts).toHaveBeenCalledWith({ companyId: 'c1' });
  });
});
