import { describe, expect, it, jest } from '@jest/globals';
import { InventoryController } from '../../../../presentation/http/controllers/inventory.controller.js';
import type { InventoryService } from '../../../../application/services/inventory.service.js';

describe('InventoryController', () => {
  it('forwards query scope to service', async () => {
    const service: Pick<InventoryService, 'getInventoryContext'> = {
      getInventoryContext: jest.fn(async () => ({
        systems: [],
        teams: [],
        collaborators: [],
        vendors: [],
        departments: []
      }))
    };

    const controller = new InventoryController(service as InventoryService);
    const result = await controller.getContext({
      companyId: 'c1',
      departmentId: 'd1'
    });

    expect(service.getInventoryContext).toHaveBeenCalledWith({
      companyId: 'c1',
      departmentId: 'd1'
    });
    expect(result.vendors).toEqual([]);
  });
});

