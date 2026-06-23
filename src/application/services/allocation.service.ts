import { Inject, Injectable } from '@nestjs/common';
import type { Allocation } from '../../domain/entities/Allocation.js';
import type { AllocationRepository } from '../../domain/repositories/AllocationRepository.js';
import { ALLOCATION_REPOSITORY } from '../../domain/repositories/tokens.js';

@Injectable()
export class AllocationService {
  constructor(
    @Inject(ALLOCATION_REPOSITORY)
    private readonly repository: AllocationRepository
  ) {}

  listAllocations(): Promise<Allocation[]> {
    return this.repository.listAllocations();
  }
}
