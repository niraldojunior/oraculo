import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InitiativeService } from '../../../application/services/initiative.service.js';
import { CacheService } from '../../../infrastructure/cache/cache.service.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import type { ClientTeamRepository } from '../../../domain/repositories/ClientTeamRepository.js';
import type { ClientTeamWriteData } from '../../../domain/entities/ClientTeam.js';

const base: Initiative = {
  id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1',
  status: 'Backlog', priority: 1, createdAt: new Date()
};

function makeRepo(overrides: Partial<InitiativeRepository> = {}): InitiativeRepository {
  return {
    listByScope: jest.fn(async () => [base]),
    findById: jest.fn(async () => base),
    create: jest.fn(async () => ({ ...base, id: 'i2' })),
    save: jest.fn(async (i: Initiative) => i),
    delete: jest.fn(async () => undefined),
    ...overrides,
    countByClientTeamId: overrides.countByClientTeamId ?? jest.fn(async () => 0)
  };
}

function makeClientTeamRepo(overrides: Partial<ClientTeamRepository> = {}): ClientTeamRepository {
  return {
    listClientTeams: jest.fn(async () => []),
    findClientTeamById: jest.fn(async () => null),
    createClientTeam: jest.fn(async (data: ClientTeamWriteData) => ({ id: 'ct1', name: '', companyId: '', departmentId: '', ...data })),
    updateClientTeam: jest.fn(async (id: string, data: ClientTeamWriteData) => ({ id, name: '', companyId: '', departmentId: '', ...data })),
    deleteClientTeam: jest.fn(async () => undefined),
    ...overrides
  };
}

describe('InitiativeService', () => {
  it('listByScope delegates to repository via cache', async () => {
    const cache = new CacheService();
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    const result = await service.listByScope({ companyId: 'c1' });
    expect(result).toHaveLength(1);
    expect(repo.listByScope).toHaveBeenCalledTimes(1);

    // second call should hit cache
    await service.listByScope({ companyId: 'c1' });
    expect(repo.listByScope).toHaveBeenCalledTimes(1);
  });

  it('listByScope builds cache key with both companyId and departmentId', async () => {
    const cache = new CacheService();
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.listByScope({ companyId: 'c1', departmentId: 'd1' });
    expect(repo.listByScope).toHaveBeenCalledTimes(1);

    await service.listByScope({ companyId: 'c1', departmentId: 'd1' });
    expect(repo.listByScope).toHaveBeenCalledTimes(1);
  });

  it('listByScope builds cache key with no scope', async () => {
    const cache = new CacheService();
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.listByScope({});
    expect(repo.listByScope).toHaveBeenCalledTimes(1);
  });

  it('getById returns initiative from cache', async () => {
    const cache = new CacheService();
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    const result = await service.getById('i1');
    expect(result.id).toBe('i1');
  });

  it('getById throws NotFoundException when not found', async () => {
    const cache = new CacheService();
    const repo = makeRepo({ findById: jest.fn(async () => null) });
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getHistory returns history array from initiative', async () => {
    const cache = new CacheService();
    const withHistory = { ...base, history: [{ action: 'created' }] };
    const repo = makeRepo({ findById: jest.fn(async () => withHistory as any) });
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    const history = await service.getHistory('i1');
    expect(history).toHaveLength(1);
  });

  it('getHistory returns empty array when no history field', async () => {
    const cache = new CacheService();
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    const history = await service.getHistory('i1');
    expect(history).toHaveLength(0);
  });

  it('create invalidates cache and delegates to repository', async () => {
    const cache = new CacheService();
    cache.set('initiatives:list:c1:', [base]);
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.create({ title: 'New', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 2 });

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(cache.get('initiatives:list:c1:')).toBeNull();
  });

  it('update merges history and milestones, then invalidates cache', async () => {
    const cache = new CacheService();
    const current = {
      ...base,
      history: [{ id: 'h1', action: 'created' }],
      milestones: [
        { id: 'm1', order: 0, name: 'M1' },
        { id: 'm2', order: 1, name: 'M2' }
      ]
    };
    const repo = makeRepo({ findById: jest.fn(async () => current as any) });
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.update('i1', {
      title: 'Updated',
      history: [{ id: 'h2', action: 'changed' }],
      milestones: [{ id: 'm1', order: 0, name: 'M1 updated' }],
      removedMilestoneIds: ['m2']
    } as any);

    expect(repo.findById).toHaveBeenCalledWith('i1');
    const saveArg = (repo.save as jest.Mock).mock.calls[0][0] as any;
    expect(saveArg.title).toBe('Updated');
    expect(saveArg.history).toHaveLength(2);
    expect(saveArg.milestones).toHaveLength(1);
    expect(saveArg.milestones[0].name).toBe('M1 updated');
  });

  it('delete removes the initiative and invalidates cache', async () => {
    const cache = new CacheService();
    cache.set('initiatives:list:c1:', [base]);
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.delete('i1');

    expect(repo.findById).toHaveBeenCalledWith('i1');
    expect(repo.delete).toHaveBeenCalledWith('i1');
    expect(cache.get('initiatives:list:c1:')).toBeNull();
  });

  it('update sorts merged milestones by order when there is more than one', async () => {
    const cache = new CacheService();
    const current = {
      ...base,
      history: [],
      milestones: [
        { id: 'm1', order: 1, name: 'M1' },
        { id: 'm2', order: 0, name: 'M2' }
      ]
    };
    const repo = makeRepo({ findById: jest.fn(async () => current as any) });
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.update('i1', {});

    const saveArg = (repo.save as jest.Mock).mock.calls[0][0] as any;
    expect(saveArg.milestones.map((m: any) => m.id)).toEqual(['m2', 'm1']);
  });

  it('update handles initiative without existing history/milestones and milestones without ids or order', async () => {
    const cache = new CacheService();
    const repo = makeRepo({ findById: jest.fn(async () => base) });
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.update('i1', {
      milestones: [{ name: 'No id, no order' }, { id: 'm2', order: 0, name: 'M2' }],
      removedMilestoneIds: ['m2']
    } as any);

    const saveArg = (repo.save as jest.Mock).mock.calls[0][0] as any;
    expect(saveArg.history).toEqual([]);
    expect(saveArg.milestones).toHaveLength(1);
    expect(saveArg.milestones[0].name).toBe('No id, no order');
  });

  it('update keeps current milestones without ids using index fallback when not removed', async () => {
    const cache = new CacheService();
    const current = { ...base, history: [], milestones: [{ name: 'Keep me' }] };
    const repo = makeRepo({ findById: jest.fn(async () => current as any) });
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.update('i1', {});

    const saveArg = (repo.save as jest.Mock).mock.calls[0][0] as any;
    expect(saveArg.milestones).toHaveLength(1);
    expect(saveArg.milestones[0].name).toBe('Keep me');
  });

  it('reprioritize throws when initiative not found', async () => {
    const cache = new CacheService();
    const repo = makeRepo({ findById: jest.fn(async () => null) });
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await expect(service.reprioritize('x', 5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reprioritize updates priority and invalidates cache', async () => {
    const cache = new CacheService();
    cache.set('initiatives:list:c1:', [base]);
    const repo = makeRepo();
    const service = new InitiativeService(repo, cache, makeClientTeamRepo());

    await service.reprioritize('i1', 10);

    const saveArg = (repo.save as jest.Mock).mock.calls[0][0] as Initiative;
    expect(saveArg.priority).toBe(10);
    expect(cache.get('initiatives:list:c1:')).toBeNull();
  });

  it('assigns a client team by id and exposes the derived legacy alias', async () => {
    const cache = new CacheService();
    const repo = makeRepo();
    const team = { id: 'ct1', name: 'Operações', companyId: 'c1', departmentId: 'd1' };
    const teams = makeClientTeamRepo({ findClientTeamById: jest.fn(async () => team) });
    const service = new InitiativeService(repo, cache, teams);

    await service.create({
      title: 'New', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1, clientTeamId: 'ct1'
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      clientTeamId: 'ct1', clientTeam: team, originDirectorate: 'Operações'
    }));
  });

  it('resolves a unique legacy originDirectorate during rollout', async () => {
    const repo = makeRepo();
    const team = { id: 'ct1', name: 'Operações', companyId: 'c1', departmentId: 'd1' };
    const teams = makeClientTeamRepo({ listClientTeams: jest.fn(async () => [team]) });
    const service = new InitiativeService(repo, new CacheService(), teams);

    await service.update('i1', { originDirectorate: 'Operações' });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ clientTeamId: 'ct1', clientTeam: team }));
  });

  it('clears the client team when clientTeamId is null', async () => {
    const current = { ...base, clientTeamId: 'ct1', originDirectorate: 'Operações' };
    const repo = makeRepo({ findById: jest.fn(async () => current) });
    const service = new InitiativeService(repo, new CacheService(), makeClientTeamRepo());

    await service.update('i1', { clientTeamId: null });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      clientTeamId: null, clientTeam: null, originDirectorate: undefined
    }));
  });

  it('rejects missing, invalid, ambiguous and cross-scope client teams', async () => {
    const cache = new CacheService();
    const repo = makeRepo();
    const wrongScope = { id: 'ct1', name: 'X', companyId: 'c2', departmentId: 'd1' };
    const duplicate = { id: 'ct2', name: 'Duplicada', companyId: 'c1', departmentId: 'd1' };

    await expect(new InitiativeService(repo, cache, makeClientTeamRepo())
      .update('i1', { clientTeamId: 'missing' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(new InitiativeService(repo, cache, makeClientTeamRepo())
      .update('i1', { clientTeamId: 123 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(new InitiativeService(repo, cache, makeClientTeamRepo({ findClientTeamById: jest.fn(async () => wrongScope) }))
      .update('i1', { clientTeamId: 'ct1' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(new InitiativeService(repo, cache, makeClientTeamRepo({ listClientTeams: jest.fn(async () => []) }))
      .update('i1', { originDirectorate: 'Inexistente' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(new InitiativeService(repo, cache, makeClientTeamRepo({ listClientTeams: jest.fn(async () => [duplicate, { ...duplicate, id: 'ct3' }]) }))
      .update('i1', { originDirectorate: 'Duplicada' })).rejects.toBeInstanceOf(ConflictException);
    await expect(new InitiativeService(repo, cache, makeClientTeamRepo())
      .create({ title: 'No scope', status: 'Backlog', priority: 0, clientTeamId: 'ct1' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a create without client team even when the scope is empty', async () => {
    // A UI manda sempre `clientTeamId: null` e `originDirectorate: ''`; sem área
    // demandante não há o que resolver, então não se exige company/department.
    const repo = makeRepo();
    const service = new InitiativeService(repo, new CacheService(), makeClientTeamRepo());

    await service.create({
      title: 'Sem área', status: '1- Backlog', companyId: '', departmentId: '',
      clientTeamId: null, originDirectorate: ''
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ clientTeamId: null }));
  });

  it('create keeps the whole form payload and defaults priority to 0', async () => {
    const repo = makeRepo();
    const service = new InitiativeService(repo, new CacheService(), makeClientTeamRepo());

    await service.create({
      title: 'Nova', status: '1- Backlog', companyId: 'c1', departmentId: 'd1',
      type: '2- Projeto', benefit: 'Objetivo', leaderId: 'col-1', createdById: 'u1',
      memberIds: ['col-2'], impactedSystemIds: ['sys-1'], startDate: '2026-08-01', endDate: '2026-09-01'
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Nova', status: '1- Backlog', priority: 0, type: '2- Projeto', benefit: 'Objetivo',
      leaderId: 'col-1', createdById: 'u1', memberIds: ['col-2'], impactedSystemIds: ['sys-1'],
      startDate: '2026-08-01', endDate: '2026-09-01'
    }));
  });
});
