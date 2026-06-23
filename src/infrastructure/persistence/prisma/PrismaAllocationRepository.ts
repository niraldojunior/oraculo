import type { PrismaClient } from '@prisma/client';
import type { Allocation } from '../../../domain/entities/Allocation.js';
import type { AllocationRepository } from '../../../domain/repositories/AllocationRepository.js';

export class PrismaAllocationRepository implements AllocationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listAllocations(): Promise<Allocation[]> {
    return (await this.prisma.allocation.findMany()) as unknown as Allocation[];
  }
}
