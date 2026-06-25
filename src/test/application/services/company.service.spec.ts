import { describe, expect, it, jest } from '@jest/globals';
import { CompanyService } from '../../../application/services/company.service.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/tokens.js';
import type { CompanyRepository } from '../../../domain/repositories/CompanyRepository.js';
import type { CompanyWriteData } from '../../../domain/entities/Company.js';

describe('CompanyService', () => {
  it('sanitizes logo URL before create', async () => {
    const repository: CompanyRepository = {
      listCompanies: jest.fn(async () => []),
      createCompany: jest.fn(async (data: CompanyWriteData) => ({
        id: 'c1',
        fantasyName: data.fantasyName ?? '',
        realName: data.realName ?? '',
        logo: data.logo ?? '',
        description: data.description ?? ''
      })),
      updateCompany: jest.fn(async (_id: string, data: CompanyWriteData) => ({
        id: 'c1',
        fantasyName: data.fantasyName ?? '',
        realName: data.realName ?? '',
        logo: data.logo ?? '',
        description: data.description ?? ''
      })),
      deleteCompany: jest.fn(async () => undefined)
    };

    const service = new CompanyService(repository);

    await service.createCompany({
      fantasyName: 'Acme',
      realName: 'Acme Inc',
      logo: '/api/_img/company/c1'
    });

    const firstCallArg = (repository.createCompany as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(firstCallArg).not.toHaveProperty('logo');
  });

  it('exposes DI token', () => {
    expect(COMPANY_REPOSITORY).toBeDefined();
  });

  it('lists, updates and deletes companies', async () => {
    const repository: CompanyRepository = {
      listCompanies: jest.fn(async () => [{
        id: 'c1',
        fantasyName: 'Acme',
        realName: 'Acme Inc',
        logo: null,
        description: null
      } as any]),
      createCompany: jest.fn(async (data: CompanyWriteData) => ({ id: 'c1', ...data } as any)),
      updateCompany: jest.fn(async (id: string, data: CompanyWriteData) => ({ id, ...data } as any)),
      deleteCompany: jest.fn(async () => undefined)
    };

    const service = new CompanyService(repository);
    const list = await service.listCompanies();
    expect(list).toHaveLength(1);

    await service.updateCompany('c1', {
      fantasyName: 'Acme',
      realName: 'Acme SA',
      logo: '/api/_img/company/c1'
    });
    const updateArg = (repository.updateCompany as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(updateArg).not.toHaveProperty('logo');

    await service.deleteCompany('c1');
    expect(repository.deleteCompany).toHaveBeenCalledWith('c1');
  });
});

