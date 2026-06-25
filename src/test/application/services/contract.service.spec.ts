import { describe, expect, it, jest } from '@jest/globals';
import { ContractService } from '../../../application/services/contract.service.js';
import type { ContractRepository } from '../../../domain/repositories/ContractRepository.js';
import type { ContractWriteData } from '../../../domain/entities/Contract.js';

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

  it('creates, updates and deletes contracts', async () => {
    const repository: ContractRepository = {
      listContracts: jest.fn(async () => []),
      createContract: jest.fn(async (data: ContractWriteData) => ({ id: 'k1', ...data } as any)),
      updateContract: jest.fn(async (id: string, data: ContractWriteData) => ({ id, ...data } as any)),
      deleteContract: jest.fn(async () => undefined)
    };

    const service = new ContractService(repository);
    const payload: ContractWriteData = {
      companyId: 'c1',
      departmentId: 'd1',
      vendorId: 'v1',
      number: 'CT-1',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      model: 'Anual',
      annualCost: 10
    };

    await service.createContract(payload);
    expect(repository.createContract).toHaveBeenCalledWith(payload);

    await service.updateContract('k1', payload);
    expect(repository.updateContract).toHaveBeenCalledWith('k1', payload);

    await service.deleteContract('k1');
    expect(repository.deleteContract).toHaveBeenCalledWith('k1');
  });
});

