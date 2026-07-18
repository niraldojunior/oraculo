import { describe, expect, it, jest } from '@jest/globals';
import { BusinessUnitService } from '../../../application/services/business-unit.service.js';
import type { BusinessUnitRepository } from '../../../domain/repositories/BusinessUnitRepository.js';
import type { BusinessUnitWriteData } from '../../../domain/entities/BusinessUnit.js';

describe('BusinessUnitService', () => {
  it('lists, creates, updates and deletes business units', async () => {
    const repository: BusinessUnitRepository = {
      listBusinessUnits: jest.fn(async () => [{ id: 'b1', name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' }]),
      createBusinessUnit: jest.fn(async (data: BusinessUnitWriteData) => ({ id: 'b1', ...data } as any)),
      updateBusinessUnit: jest.fn(async (id: string, data: BusinessUnitWriteData) => ({ id, ...data } as any)),
      deleteBusinessUnit: jest.fn(async () => undefined)
    };

    const service = new BusinessUnitService(repository);

    const list = await service.listBusinessUnits({ companyId: 'c1', departmentId: 'd1' });
    expect(list).toHaveLength(1);
    expect(repository.listBusinessUnits).toHaveBeenCalledWith({ companyId: 'c1', departmentId: 'd1' });

    await service.createBusinessUnit({ name: 'FTTH', companyId: 'c1', departmentId: 'd1' });
    expect(repository.createBusinessUnit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'FTTH' })
    );

    const payload: BusinessUnitWriteData = { name: 'Corporativo' };
    await service.updateBusinessUnit('b1', payload);
    expect(repository.updateBusinessUnit).toHaveBeenCalledWith('b1', payload);

    await service.deleteBusinessUnit('b1');
    expect(repository.deleteBusinessUnit).toHaveBeenCalledWith('b1');
  });
});
