import { describe, expect, it, jest } from '@jest/globals';
import { ClientTeamService } from '../../../application/services/client-team.service.js';
import type { ClientTeamRepository } from '../../../domain/repositories/ClientTeamRepository.js';
import type { ClientTeamWriteData } from '../../../domain/entities/ClientTeam.js';

describe('ClientTeamService', () => {
  it('lists, creates, updates and deletes client teams', async () => {
    const repository: ClientTeamRepository = {
      listClientTeams: jest.fn(async () => [
        { id: 'ct1', name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1', businessUnitName: 'Atacado & B2B' }
      ]),
      createClientTeam: jest.fn(async (data: ClientTeamWriteData) => ({ id: 'ct1', ...data } as any)),
      updateClientTeam: jest.fn(async (id: string, data: ClientTeamWriteData) => ({ id, ...data } as any)),
      deleteClientTeam: jest.fn(async () => undefined)
    };

    const service = new ClientTeamService(repository);

    const list = await service.listClientTeams({ companyId: 'c1' });
    expect(list).toHaveLength(1);
    expect(repository.listClientTeams).toHaveBeenCalledWith({ companyId: 'c1' });

    await service.createClientTeam({ name: 'Comercial', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' });
    expect(repository.createClientTeam).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Comercial', businessUnitId: 'b1' })
    );

    const payload: ClientTeamWriteData = { businessUnitId: null };
    await service.updateClientTeam('ct1', payload);
    expect(repository.updateClientTeam).toHaveBeenCalledWith('ct1', payload);

    await service.deleteClientTeam('ct1');
    expect(repository.deleteClientTeam).toHaveBeenCalledWith('ct1');
  });
});
