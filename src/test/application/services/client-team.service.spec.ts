import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ClientTeamService } from '../../../application/services/client-team.service.js';
import type { ClientTeamRepository } from '../../../domain/repositories/ClientTeamRepository.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';
import type { ClientTeamWriteData } from '../../../domain/entities/ClientTeam.js';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import { CacheService } from '../../../infrastructure/cache/cache.service.js';

const currentTeam = {
  id: 'ct1', name: 'Operações', companyId: 'c1', departmentId: 'd1',
  businessUnitId: 'b1', businessUnitName: 'Atacado & B2B'
};

function makeClientTeamRepository(): ClientTeamRepository {
  return {
    listClientTeams: jest.fn(async () => [currentTeam]),
    findClientTeamById: jest.fn(async () => currentTeam),
    createClientTeam: jest.fn(async (data: ClientTeamWriteData) => ({ id: 'ct1', ...data } as any)),
    updateClientTeam: jest.fn(async (id: string, data: ClientTeamWriteData) => ({ ...currentTeam, id, ...data })),
    deleteClientTeam: jest.fn(async () => undefined)
  };
}

function makeInitiativeRepository(referenceCount = 0): InitiativeRepository {
  return {
    listByScope: jest.fn(async () => []),
    findById: jest.fn(async () => null),
    countByClientTeamId: jest.fn(async () => referenceCount),
    save: jest.fn(async (initiative: Initiative) => initiative),
    create: jest.fn(async (payload: Omit<Initiative, 'id' | 'createdAt'>) => ({ ...payload, id: 'i1', createdAt: new Date() })),
    delete: jest.fn(async () => undefined)
  };
}

describe('ClientTeamService', () => {
  it('lists, creates, updates and deletes client teams while invalidating initiatives', async () => {
    const repository = makeClientTeamRepository();
    const cache = new CacheService();
    cache.set('initiatives:list:c1:d1', []);
    const service = new ClientTeamService(repository, makeInitiativeRepository(), cache);

    expect(await service.listClientTeams({ companyId: 'c1' })).toHaveLength(1);
    await service.createClientTeam({ name: 'Comercial', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' });
    const payload: ClientTeamWriteData = { businessUnitId: null };
    await service.updateClientTeam('ct1', payload);
    await service.deleteClientTeam('ct1');

    expect(repository.createClientTeam).toHaveBeenCalled();
    expect(repository.updateClientTeam).toHaveBeenCalledWith('ct1', payload);
    expect(repository.deleteClientTeam).toHaveBeenCalledWith('ct1');
    expect(cache.get('initiatives:list:c1:d1')).toBeNull();
  });

  it('blocks deleting a client team referenced by initiatives', async () => {
    const repository = makeClientTeamRepository();
    const service = new ClientTeamService(repository, makeInitiativeRepository(2), new CacheService());
    await expect(service.deleteClientTeam('ct1')).rejects.toBeInstanceOf(ConflictException);
    expect(repository.deleteClientTeam).not.toHaveBeenCalled();
  });

  it('rejects moving a client team to another scope', async () => {
    const service = new ClientTeamService(makeClientTeamRepository(), makeInitiativeRepository(), new CacheService());
    await expect(service.updateClientTeam('ct1', { companyId: 'c2' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.updateClientTeam('ct1', { departmentId: 'd2' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
