import { Injectable } from '@nestjs/common';
import type { Allocation } from '../../../domain/entities/Allocation.js';
import type { AllocationRepository } from '../../../domain/repositories/AllocationRepository.js';

@Injectable()
export class InMemoryAllocationRepository implements AllocationRepository {
  async listAllocations(): Promise<Allocation[]> {
    return [];
  }
}
