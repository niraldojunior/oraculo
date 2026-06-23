import { describe, expect, it, jest } from '@jest/globals';
import { SystemService } from '../application/services/system.service.js';
import type { SystemRepository } from '../domain/repositories/SystemRepository.js';
import type { SystemWriteData } from '../domain/entities/System.js';

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
});
