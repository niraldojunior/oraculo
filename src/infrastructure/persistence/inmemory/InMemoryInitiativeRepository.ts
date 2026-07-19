import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';
import { InMemoryClientTeamRepository } from './InMemoryClientTeamRepository.js';

@Injectable()
export class InMemoryInitiativeRepository implements InitiativeRepository {
  private readonly initiatives = new Map<string, Initiative>();

  constructor(private readonly clientTeams?: InMemoryClientTeamRepository) {}

  private async withCurrentClientTeam(initiative: Initiative): Promise<Initiative> {
    if (!initiative.clientTeamId || !this.clientTeams) return initiative;
    const team = await this.clientTeams.findClientTeamById(initiative.clientTeamId);
    return {
      ...initiative,
      clientTeam: team,
      originDirectorate: team?.name
    };
  }

  async listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    const filtered = [...this.initiatives.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
    return Promise.all(filtered.map(item => this.withCurrentClientTeam(item)));
  }

  async findById(id: string): Promise<Initiative | null> {
    const initiative = this.initiatives.get(id);
    return initiative ? this.withCurrentClientTeam(initiative) : null;
  }

  async countByClientTeamId(clientTeamId: string): Promise<number> {
    return [...this.initiatives.values()].filter(item => item.clientTeamId === clientTeamId).length;
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
