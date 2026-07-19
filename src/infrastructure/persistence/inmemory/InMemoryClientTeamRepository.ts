import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ClientTeam, ClientTeamWriteData } from '../../../domain/entities/ClientTeam.js';
import type { ClientTeamRepository } from '../../../domain/repositories/ClientTeamRepository.js';

@Injectable()
export class InMemoryClientTeamRepository implements ClientTeamRepository {
  private readonly clientTeams = new Map<string, ClientTeam>();

  async listClientTeams(scope: { companyId?: string; departmentId?: string }): Promise<ClientTeam[]> {
    return [...this.clientTeams.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async findClientTeamById(id: string): Promise<ClientTeam | null> {
    return this.clientTeams.get(id) ?? null;
  }

  async createClientTeam(data: ClientTeamWriteData): Promise<ClientTeam> {
    const created: ClientTeam = {
      id: randomUUID(),
      name: data.name ?? '',
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? '',
      businessUnitId: data.businessUnitId ?? null
    };
    this.clientTeams.set(created.id, created);
    return created;
  }

  async updateClientTeam(id: string, data: ClientTeamWriteData): Promise<ClientTeam> {
    const current = this.clientTeams.get(id);
    if (!current) {
      throw new Error('ClientTeam not found');
    }

    const updated: ClientTeam = { ...current, ...data };
    this.clientTeams.set(id, updated);
    return updated;
  }

  async deleteClientTeam(id: string): Promise<void> {
    this.clientTeams.delete(id);
  }
}
