import { describe, expect, it, jest } from '@jest/globals';
import { AllocationService } from '../application/services/allocation.service.js';
import type { AllocationRepository } from '../domain/repositories/AllocationRepository.js';

describe('AllocationService', () => {
  it('delegates list to repository', async () => {
    const repository: AllocationRepository = {
      listAllocations: jest.fn(async () => [])
    };

    const service = new AllocationService(repository);
    const result = await service.listAllocations();

    expect(repository.listAllocations).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
