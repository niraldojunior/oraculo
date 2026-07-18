import { describe, expect, it } from '@jest/globals';
import { InMemoryClientTeamRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryClientTeamRepository.js';

describe('InMemoryClientTeamRepository', () => {
  it('creates, lists by scope, updates and deletes', async () => {
    const repo = new InMemoryClientTeamRepository();

    const created = await repo.createClientTeam({ name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' });
    expect(created.id).toBeTruthy();
    expect(created.businessUnitId).toBe('b1');

    await repo.createClientTeam({ name: 'Comercial', companyId: 'c2', departmentId: 'd2' });

    const byCompany = await repo.listClientTeams({ companyId: 'c1' });
    expect(byCompany).toHaveLength(1);

    const byDept = await repo.listClientTeams({ departmentId: 'd2' });
    expect(byDept).toHaveLength(1);

    const all = await repo.listClientTeams({});
    expect(all).toHaveLength(2);

    const updated = await repo.updateClientTeam(created.id, { businessUnitId: null, name: 'Engenharia' });
    expect(updated.businessUnitId).toBeNull();
    expect(updated.name).toBe('Engenharia');

    await repo.deleteClientTeam(created.id);
    expect(await repo.listClientTeams({ companyId: 'c1' })).toHaveLength(0);
  });

  it('defaults missing fields on create', async () => {
    const repo = new InMemoryClientTeamRepository();
    const created = await repo.createClientTeam({});
    expect(created.name).toBe('');
    expect(created.companyId).toBe('');
    expect(created.departmentId).toBe('');
    expect(created.businessUnitId).toBeNull();
  });

  it('throws when updating a missing client team', async () => {
    const repo = new InMemoryClientTeamRepository();
    await expect(repo.updateClientTeam('missing', { name: 'X' })).rejects.toThrow('ClientTeam not found');
  });
});
