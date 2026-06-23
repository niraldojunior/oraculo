import type { Allocation } from '../entities/Allocation.js';

export interface AllocationRepository {
  listAllocations(): Promise<Allocation[]>;
}
