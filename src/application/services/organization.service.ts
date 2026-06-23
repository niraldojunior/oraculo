import { Inject, Injectable } from '@nestjs/common';
import type { Collaborator, CollaboratorWriteData } from '../../domain/entities/Collaborator.js';
import type { Team, TeamWriteData } from '../../domain/entities/Team.js';
import { ORGANIZATION_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { OrganizationRepository } from '../../domain/repositories/OrganizationRepository.js';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repository: OrganizationRepository
  ) {}

  createTeam(data: TeamWriteData): Promise<Team> {
    return this.repository.createTeam(this.sanitizeTeam(data));
  }

  listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<Team[]> {
    return this.repository.listTeamsByScope(scope);
  }

  updateTeam(id: string, data: TeamWriteData): Promise<Team> {
    return this.repository.updateTeam(id, this.sanitizeTeam(data));
  }

  deleteTeam(id: string): Promise<void> {
    return this.repository.deleteTeam(id);
  }

  createCollaborator(data: CollaboratorWriteData): Promise<Collaborator> {
    return this.repository.createCollaborator(this.sanitizeCollaborator(data));
  }

  async listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
  }): Promise<Collaborator[]> {
    const collaborators = await this.repository.listCollaboratorsByScope(params);
    return collaborators.map(c => ({
      ...c,
      role: c.role === 'Engineer/Analyst' || c.role === 'ENGINEER/ANALYST' ? 'Engineer' : c.role
    }));
  }

  findCollaboratorById(id: string): Promise<Collaborator | null> {
    return this.repository.findCollaboratorById(id);
  }

  findCollaboratorByEmail(email: string): Promise<Collaborator | null> {
    return this.repository.findCollaboratorByEmail(email);
  }

  updateCollaborator(id: string, data: CollaboratorWriteData): Promise<Collaborator> {
    return this.repository.updateCollaborator(id, this.sanitizeCollaborator(data));
  }

  deleteCollaborator(id: string): Promise<void> {
    return this.repository.deleteCollaborator(id);
  }

  toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }): Promise<void> {
    return this.repository.toggleCollaboratorSkill(params);
  }

  private sanitizeTeam(data: TeamWriteData): TeamWriteData {
    const clean = { ...data };
    if (clean.parentTeamId === '') clean.parentTeamId = null;
    if (clean.leaderId === '') clean.leaderId = null;
    return clean;
  }

  private sanitizeCollaborator(data: CollaboratorWriteData): CollaboratorWriteData {
    const clean = { ...data };

    if (clean.squadId === '') clean.squadId = null;
    if (clean.vacationStart === '') clean.vacationStart = null;
    if (clean.startDate === '') clean.startDate = null;
    if (clean.endDate === '') clean.endDate = null;
    if (clean.birthday === '') clean.birthday = null;

    if (clean.role === 'VP') clean.role = 'Head';
    if (clean.role === 'Engineer/Analyst' || clean.role === 'ENGINEER/ANALYST') {
      clean.role = 'Engineer';
    }

    if (typeof clean.photoUrl === 'string' && clean.photoUrl.startsWith('/api/_img/')) {
      delete clean.photoUrl;
    }

    return clean;
  }
}
