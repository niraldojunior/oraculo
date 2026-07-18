import { describe, expect, it } from '@jest/globals';
import { InMemoryBusinessUnitRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryBusinessUnitRepository.js';

describe('InMemoryBusinessUnitRepository', () => {
  it('creates, lists by scope, updates and deletes', async () => {
    const repo = new InMemoryBusinessUnitRepository();

    const created = await repo.createBusinessUnit({ name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Atacado & B2B');

    await repo.createBusinessUnit({ name: 'Other', companyId: 'c2', departmentId: 'd2' });

    const byCompany = await repo.listBusinessUnits({ companyId: 'c1' });
    expect(byCompany).toHaveLength(1);

    const byDept = await repo.listBusinessUnits({ departmentId: 'd2' });
    expect(byDept).toHaveLength(1);

    const all = await repo.listBusinessUnits({});
    expect(all).toHaveLength(2);

    const updated = await repo.updateBusinessUnit(created.id, { name: 'FTTH' });
    expect(updated.name).toBe('FTTH');

    await repo.deleteBusinessUnit(created.id);
    expect(await repo.listBusinessUnits({ companyId: 'c1' })).toHaveLength(0);
  });

  it('defaults missing fields on create', async () => {
    const repo = new InMemoryBusinessUnitRepository();
    const created = await repo.createBusinessUnit({});
    expect(created.name).toBe('');
    expect(created.companyId).toBe('');
    expect(created.departmentId).toBe('');
  });

  it('throws when updating a missing business unit', async () => {
    const repo = new InMemoryBusinessUnitRepository();
    await expect(repo.updateBusinessUnit('missing', { name: 'X' })).rejects.toThrow('BusinessUnit not found');
  });
});
