import { describe, expect, it, jest } from '@jest/globals';
import { SystemController } from '../../../../presentation/http/controllers/system.controller.js';
import type { SystemService } from '../../../../application/services/system.service.js';
import type { System } from '../../../../domain/entities/System.js';

describe('SystemController', () => {
  const system: System = {
    id: 's1',
    companyId: 'c1',
    departmentId: 'd1',
    name: 'ERP',
    category: 'Core',
    criticality: 'Tier 2',
    ownerTeamId: 't1',
    lifecycleStatus: 'Ativo Greenfield',
    debtScore: 1,
    description: 'Main ERP'
  };

  function createServiceDouble(): Pick<
    SystemService,
    'listSystems' | 'getSystemById' | 'createSystem' | 'updateSystem' | 'deleteSystem'
  > {
    return {
      listSystems: jest.fn(async () => [system]),
      getSystemById: jest.fn(async () => system),
      createSystem: jest.fn(async () => system),
      updateSystem: jest.fn(async () => system),
      deleteSystem: jest.fn(async () => undefined)
    };
  }

  it('calls list with query scope', async () => {
    const service = createServiceDouble();
    const controller = new SystemController(service as SystemService);

    const result = await controller.list('c1', 'd1');

    expect(service.listSystems).toHaveBeenCalledWith({ companyId: 'c1', departmentId: 'd1' });
    expect(result).toHaveLength(1);
  });

  it('calls delete and returns success message', async () => {
    const service = createServiceDouble();
    const controller = new SystemController(service as SystemService);

    const result = await controller.delete('s1');

    expect(service.deleteSystem).toHaveBeenCalledWith('s1');
    expect(result).toEqual({ message: 'System deleted' });
  });

  it('calls getById', async () => {
    const service = createServiceDouble();
    const controller = new SystemController(service as SystemService);

    const result = await controller.getById('s1');

    expect(service.getSystemById).toHaveBeenCalledWith('s1');
    expect(result.id).toBe('s1');
  });

  it('calls create', async () => {
    const service = createServiceDouble();
    const controller = new SystemController(service as SystemService);
    const payload = {
      companyId: 'c1',
      departmentId: 'd1',
      name: 'ERP',
      criticality: 'Tier 2',
      lifecycleStatus: 'Ativo Greenfield',
      debtScore: 1
    } as any;

    const result = await controller.create(payload);

    expect(service.createSystem).toHaveBeenCalledWith(payload);
    expect(result.id).toBe('s1');
  });

  it('calls update', async () => {
    const service = createServiceDouble();
    const controller = new SystemController(service as SystemService);
    const payload = { name: 'ERP 2' } as any;

    const result = await controller.update('s1', payload);

    expect(service.updateSystem).toHaveBeenCalledWith('s1', payload);
    expect(result.id).toBe('s1');
  });
});

