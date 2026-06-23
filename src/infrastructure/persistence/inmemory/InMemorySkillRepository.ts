import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Skill, SkillWriteData } from '../../../domain/entities/Skill.js';
import type { SkillRepository } from '../../../domain/repositories/SkillRepository.js';

@Injectable()
export class InMemorySkillRepository implements SkillRepository {
  private readonly skills = new Map<string, Skill>();

  async listSkills(scope: { companyId?: string; departmentId?: string }): Promise<Skill[]> {
    return [...this.skills.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async createSkill(data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
    const created: Skill = {
      id: randomUUID(),
      name: data.name ?? '',
      description: data.description ?? '',
      familia: data.familia ?? null,
      icon: data.icon ?? null,
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? '',
      collaborators: Array.isArray(memberIds)
        ? memberIds.map(id => ({
            collaborator: {
              id,
              name: 'Member',
              role: 'Operacional',
              photoUrl: null
            }
          }))
        : []
    };
    this.skills.set(created.id, created);
    return created;
  }

  async updateSkill(id: string, data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
    const current = this.skills.get(id);
    if (!current) {
      throw new Error('Skill not found');
    }

    const updated: Skill = {
      ...current,
      ...data,
      collaborators: Array.isArray(memberIds)
        ? memberIds.map(memberId => ({
            collaborator: {
              id: memberId,
              name: 'Member',
              role: 'Operacional',
              photoUrl: null
            }
          }))
        : current.collaborators
    };

    this.skills.set(id, updated);
    return updated;
  }

  async deleteSkill(id: string): Promise<void> {
    this.skills.delete(id);
  }
}
