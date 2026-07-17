import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';

@Injectable()
export class InMemoryInitiativeRepository implements InitiativeRepository {
  private readonly initiatives = new Map<string, Initiative>();

  async listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    return [...this.initiatives.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async findById(id: string): Promise<Initiative | null> {
    return this.initiatives.get(id) ?? null;
  }

  async save(initiative: Initiative): Promise<Initiative> {
    this.initiatives.set(initiative.id, initiative);
    return initiative;
  }

  async create(payload: Omit<Initiative, 'id' | 'createdAt'>): Promise<Initiative> {
    const created: Initiative = {
      ...payload,
      id: randomUUID(),
      createdAt: new Date()
    };
    this.initiatives.set(created.id, created);
    return created;
  }

  async delete(id: string): Promise<void> {
    this.initiatives.delete(id);
  }
}
