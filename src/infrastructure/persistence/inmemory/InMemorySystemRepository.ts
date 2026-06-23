import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { System, SystemWriteData } from '../../../domain/entities/System.js';
import type { SystemRepository } from '../../../domain/repositories/SystemRepository.js';

@Injectable()
export class InMemorySystemRepository implements SystemRepository {
  private readonly systems = new Map<string, System>();

  async listSystems(scope: { companyId?: string; departmentId?: string }): Promise<System[]> {
    return [...this.systems.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async findSystemById(id: string): Promise<System | null> {
    return this.systems.get(id) ?? null;
  }

  async createSystem(data: SystemWriteData): Promise<System> {
    const created: System = {
      id: randomUUID(),
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? '',
      name: data.name ?? '',
      category: data.category ?? null,
      criticality: data.criticality ?? 'Tier 3',
      ownerTeamId: data.ownerTeamId ?? null,
      lifecycleStatus: data.lifecycleStatus ?? 'Planejado',
      debtScore: data.debtScore ?? 0,
      description: data.description ?? '',
      environments: data.environments,
      contextFiles: data.contextFiles,
      technicalSkills: data.technicalSkills,
      responsibleCollaborators: data.responsibleCollaborators
    };

    this.systems.set(created.id, created);
    return created;
  }

  async updateSystem(id: string, data: SystemWriteData): Promise<System> {
    const current = this.systems.get(id);
    if (!current) throw new Error('System not found');

    const updated: System = { ...current, ...data };
    this.systems.set(id, updated);
    return updated;
  }

  async deleteSystem(id: string): Promise<void> {
    this.systems.delete(id);
  }
}
