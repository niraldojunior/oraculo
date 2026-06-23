import { describe, expect, it, jest } from '@jest/globals';
import { InventoryService } from '../application/services/inventory.service.js';
import type { InventoryRepository } from '../domain/repositories/InventoryRepository.js';

describe('InventoryService', () => {
  it('delegates context retrieval with scope', async () => {
    const repository: InventoryRepository = {
      getInventoryContext: jest.fn(async () => ({
        systems: [],
        teams: [],
        collaborators: [],
        vendors: [],
        departments: []
      }))
    };

    const service = new InventoryService(repository);
    const result = await service.getInventoryContext({
      companyId: 'c1',
      departmentId: 'd1'
    });

    expect(repository.getInventoryContext).toHaveBeenCalledWith({
      companyId: 'c1',
      departmentId: 'd1'
    });
    expect(result.systems).toEqual([]);
  });
});
