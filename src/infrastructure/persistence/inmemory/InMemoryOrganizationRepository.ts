import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Collaborator, CollaboratorWriteData } from '../../../domain/entities/Collaborator.js';
import type { Team, TeamWriteData } from '../../../domain/entities/Team.js';
import type { OrganizationRepository } from '../../../domain/repositories/OrganizationRepository.js';

@Injectable()
export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly teams = new Map<string, Team>();
  private readonly collaborators = new Map<string, Collaborator>();
  private readonly collaboratorSkills = new Set<string>();

  async listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<Team[]> {
    return [...this.teams.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
  }): Promise<Collaborator[]> {
    return [...this.collaborators.values()].filter(item => {
      if (params.scope.companyId && item.companyId !== params.scope.companyId) return false;
      if (params.scope.departmentId && item.departmentId !== params.scope.departmentId) return false;
      return true;
    });
  }

  async findCollaboratorById(id: string): Promise<Collaborator | null> {
    return this.collaborators.get(id) ?? null;
  }

  async findCollaboratorByEmail(email: string): Promise<Collaborator | null> {
    for (const collaborator of this.collaborators.values()) {
      if (collaborator.email.toLowerCase() === email.toLowerCase()) {
        return collaborator;
      }
    }
    return null;
  }

  async createTeam(data: TeamWriteData): Promise<Team> {
    const created: Team = {
      id: randomUUID(),
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? '',
      name: data.name ?? '',
      type: data.type ?? '',
      parentTeamId: data.parentTeamId ?? null,
      leaderId: data.leaderId ?? null,
      receivesInitiatives: data.receivesInitiatives ?? false
    };
    this.teams.set(created.id, created);
    return created;
  }

  async updateTeam(id: string, data: TeamWriteData): Promise<Team> {
    const current = this.teams.get(id);
    if (!current) throw new Error('Team not found');
    const updated: Team = { ...current, ...data };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    this.teams.delete(id);
  }

  async createCollaborator(data: CollaboratorWriteData): Promise<Collaborator> {
    const created: Collaborator = {
      id: randomUUID(),
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? '',
      name: data.name ?? '',
      email: data.email ?? '',
      role: data.role ?? '',
      squadId: data.squadId ?? null,
      photoUrl: data.photoUrl ?? null,
      phone: data.phone ?? null,
      bio: data.bio ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      githubUrl: data.githubUrl ?? null,
      isAdmin: data.isAdmin ?? false,
      vacationStart: data.vacationStart ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      birthday: data.birthday ?? null,
      uf: data.uf ?? null,
      associatedCompanyIds: data.associatedCompanyIds ?? []
    };
    this.collaborators.set(created.id, created);
    return created;
  }

  async updateCollaborator(id: string, data: CollaboratorWriteData): Promise<Collaborator> {
    const current = this.collaborators.get(id);
    if (!current) throw new Error('Collaborator not found');
    const updated: Collaborator = { ...current, ...data };
    this.collaborators.set(id, updated);
    return updated;
  }

  async deleteCollaborator(id: string): Promise<void> {
    this.collaborators.delete(id);
  }

  async toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }): Promise<void> {
    const key = `${params.collaboratorId}:${params.skillId}`;
    if (params.active) {
      this.collaboratorSkills.add(key);
      return;
    }
    this.collaboratorSkills.delete(key);
  }
}
