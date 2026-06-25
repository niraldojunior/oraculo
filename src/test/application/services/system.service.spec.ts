import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { SystemService } from '../../../application/services/system.service.js';
import type { SystemRepository } from '../../../domain/repositories/SystemRepository.js';
import type { SystemWriteData } from '../../../domain/entities/System.js';

describe('SystemService', () => {
  it('normalizes empty ownerTeamId to null on create', async () => {
    const repository: SystemRepository = {
      listSystems: jest.fn(async () => []),
      findSystemById: jest.fn(async () => null),
      createSystem: jest.fn(async (data: SystemWriteData) => ({
        id: 's1',
        companyId: data.companyId ?? 'c1',
        departmentId: data.departmentId ?? 'd1',
        name: data.name ?? 'ERP',
        category: data.category ?? null,
        criticality: data.criticality ?? 'Tier 3',
        ownerTeamId: data.ownerTeamId ?? null,
        lifecycleStatus: data.lifecycleStatus ?? 'Planejado',
        debtScore: data.debtScore ?? 0,
        description: data.description ?? ''
      })),
      updateSystem: jest.fn(async (_id: string, data: SystemWriteData) => ({
        id: 's1',
        companyId: data.companyId ?? 'c1',
        departmentId: data.departmentId ?? 'd1',
        name: data.name ?? 'ERP',
        category: data.category ?? null,
        criticality: data.criticality ?? 'Tier 3',
        ownerTeamId: data.ownerTeamId ?? null,
        lifecycleStatus: data.lifecycleStatus ?? 'Planejado',
        debtScore: data.debtScore ?? 0,
        description: data.description ?? ''
      })),
      deleteSystem: jest.fn(async () => undefined)
    };

    const service = new SystemService(repository);
    await service.createSystem({
      companyId: 'c1',
      departmentId: 'd1',
      name: 'ERP',
      criticality: 'Tier 2',
      lifecycleStatus: 'Ativo Greenfield',
      debtScore: 2,
      description: 'Core ERP',
      ownerTeamId: ''
    });

    const firstCallArg = (repository.createSystem as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(firstCallArg.ownerTeamId).toBeNull();
  });

  it('lists systems and delegates delete', async () => {
    const repository: SystemRepository = {
      listSystems: jest.fn(async () => [{ id: 's1' } as any]),
      findSystemById: jest.fn(async () => ({ id: 's1' } as any)),
      createSystem: jest.fn(async (data: SystemWriteData) => ({ id: 's1', ...data } as any)),
      updateSystem: jest.fn(async (id: string, data: SystemWriteData) => ({ id, ...data } as any)),
      deleteSystem: jest.fn(async () => undefined)
    };

    const service = new SystemService(repository);
    const list = await service.listSystems({ companyId: 'c1' });
    expect(list).toHaveLength(1);

    await service.deleteSystem('s1');
    expect(repository.deleteSystem).toHaveBeenCalledWith('s1');
  });

  it('throws not found when getSystemById has no row', async () => {
    const repository: SystemRepository = {
      listSystems: jest.fn(async () => []),
      findSystemById: jest.fn(async () => null),
      createSystem: jest.fn(async (data: SystemWriteData) => ({ id: 's1', ...data } as any)),
      updateSystem: jest.fn(async (id: string, data: SystemWriteData) => ({ id, ...data } as any)),
      deleteSystem: jest.fn(async () => undefined)
    };

    const service = new SystemService(repository);
    await expect(service.getSystemById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('normalizes empty ownerTeamId to null on update', async () => {
    const repository: SystemRepository = {
      listSystems: jest.fn(async () => []),
      findSystemById: jest.fn(async () => ({ id: 's1' } as any)),
      createSystem: jest.fn(async (data: SystemWriteData) => ({ id: 's1', ...data } as any)),
      updateSystem: jest.fn(async (id: string, data: SystemWriteData) => ({ id, ...data } as any)),
      deleteSystem: jest.fn(async () => undefined)
    };

    const service = new SystemService(repository);
    await service.updateSystem('s1', {
      companyId: 'c1',
      departmentId: 'd1',
      name: 'ERP',
      criticality: 'Tier 3',
      lifecycleStatus: 'Planejado',
      debtScore: 0,
      ownerTeamId: ''
    });

    const arg = (repository.updateSystem as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(arg.ownerTeamId).toBeNull();
  });
});

