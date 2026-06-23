import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Initiative } from '../../domain/entities/Initiative.js';
import { INITIATIVE_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { InitiativeRepository } from '../../domain/repositories/InitiativeRepository.js';
import { prioritizeInitiative } from '../../domain/services/PrioritizeInitiative.js';
import type { CreateInitiativeDto } from '../dtos/initiative.dto.js';

@Injectable()
export class InitiativeService {
  constructor(
    @Inject(INITIATIVE_REPOSITORY)
    private readonly repository: InitiativeRepository
  ) {}

  listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    return this.repository.listByScope(scope);
  }

  async getById(id: string): Promise<Initiative> {
    const initiative = await this.repository.findById(id);
    if (!initiative) {
      throw new NotFoundException('Initiative not found');
    }
    return initiative;
  }

  async getHistory(id: string): Promise<unknown[]> {
    const initiative = await this.getById(id);
    const history = (initiative as Initiative & { history?: unknown[] }).history;
    return Array.isArray(history) ? history : [];
  }

  create(payload: CreateInitiativeDto): Promise<Initiative> {
    return this.repository.create(payload);
  }

  async reprioritize(id: string, nextPriority: number): Promise<Initiative> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Initiative not found');
    }

    const updated = prioritizeInitiative(current, nextPriority);
    return this.repository.save(updated);
  }
}
