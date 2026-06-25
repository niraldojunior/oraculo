import { describe, expect, it, jest } from '@jest/globals';
import { VendorService } from '../../../application/services/vendor.service.js';
import type { VendorRepository } from '../../../domain/repositories/VendorRepository.js';
import type { VendorWriteData } from '../../../domain/entities/Vendor.js';

describe('VendorService', () => {
  it('sanitizes logoUrl reference on create', async () => {
    const repository: VendorRepository = {
      listVendors: jest.fn(async () => []),
      getVendorsContext: jest.fn(async () => ({
        vendors: [],
        contracts: [],
        systems: [],
        collaborators: [],
        companies: [],
        departments: []
      })),
      createVendor: jest.fn(async (data: VendorWriteData) => ({
        id: 'v1',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        companyName: data.companyName ?? '',
        taxId: data.taxId ?? '',
        type: data.type ?? '',
        logoUrl: data.logoUrl ?? null,
        directorId: data.directorId ?? null,
        managerId: data.managerId ?? null
      })),
      updateVendor: jest.fn(async (_id: string, data: VendorWriteData) => ({
        id: 'v1',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        companyName: data.companyName ?? '',
        taxId: data.taxId ?? '',
        type: data.type ?? '',
        logoUrl: data.logoUrl ?? null,
        directorId: data.directorId ?? null,
        managerId: data.managerId ?? null
      })),
      deleteVendor: jest.fn(async () => undefined)
    };

    const service = new VendorService(repository);
    await service.createVendor({
      companyId: 'c1',
      departmentId: 'd1',
      companyName: 'Vendor Corp',
      taxId: '123',
      type: 'Parceiro',
      logoUrl: '/api/_img/vendor/v1'
    });

    const firstCallArg = (repository.createVendor as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(firstCallArg).not.toHaveProperty('logoUrl');
  });

  it('lists/context/updates/deletes vendors', async () => {
    const repository: VendorRepository = {
      listVendors: jest.fn(async () => [{ id: 'v1' } as any]),
      getVendorsContext: jest.fn(async () => ({
        vendors: [{ id: 'v1' }],
        contracts: [],
        systems: [],
        collaborators: [],
        companies: [],
        departments: []
      } as any)),
      createVendor: jest.fn(async (data: VendorWriteData) => ({ id: 'v1', ...data } as any)),
      updateVendor: jest.fn(async (id: string, data: VendorWriteData) => ({ id, ...data } as any)),
      deleteVendor: jest.fn(async () => undefined)
    };

    const service = new VendorService(repository);
    const list = await service.listVendors({ companyId: 'c1' });
    expect(list).toHaveLength(1);

    const ctx = await service.getVendorsContext({ companyId: 'c1' });
    expect(ctx.vendors).toHaveLength(1);

    await service.updateVendor('v1', {
      companyId: 'c1',
      departmentId: 'd1',
      companyName: 'Vendor 1',
      taxId: '123',
      type: 'Parceiro',
      logoUrl: '/api/_img/vendor/v1'
    });
    const arg = (repository.updateVendor as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(arg).not.toHaveProperty('logoUrl');

    await service.deleteVendor('v1');
    expect(repository.deleteVendor).toHaveBeenCalledWith('v1');
  });
});

