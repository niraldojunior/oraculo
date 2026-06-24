import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Initiative } from '../../domain/entities/Initiative.js';
import { INITIATIVE_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { InitiativeRepository } from '../../domain/repositories/InitiativeRepository.js';
import { prioritizeInitiative } from '../../domain/services/PrioritizeInitiative.js';
import type { CreateInitiativeDto } from '../dtos/initiative.dto.js';
import { CacheService } from '../../infrastructure/cache/cache.service.js';

@Injectable()
export class InitiativeService {
  constructor(
    @Inject(INITIATIVE_REPOSITORY)
    private readonly repository: InitiativeRepository,
    private readonly cache: CacheService
  ) {}

  private listKey(scope: { companyId?: string; departmentId?: string }): string {
    return `initiatives:list:${scope.companyId ?? ''}:${scope.departmentId ?? ''}`;
  }

  listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    return this.cache.getOrFetch(
      this.listKey(scope),
      () => this.repository.listByScope(scope)
    );
  }

  async getById(id: string): Promise<Initiative> {
    const initiative = await this.cache.getOrFetch(
      `initiatives:id:${id}`,
      () => this.repository.findById(id)
    );
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

  async create(payload: CreateInitiativeDto): Promise<Initiative> {
    const result = await this.repository.create(payload);
    this.cache.invalidatePrefix('initiatives');
    return result;
  }

  async reprioritize(id: string, nextPriority: number): Promise<Initiative> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Initiative not found');
    }

    const updated = prioritizeInitiative(current, nextPriority);
    const result = await this.repository.save(updated);
    this.cache.invalidatePrefix('initiatives');
    return result;
  }
}
