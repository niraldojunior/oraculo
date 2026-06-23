import type { Collaborator, CollaboratorWriteData } from '../entities/Collaborator.js';
import type { Team, TeamWriteData } from '../entities/Team.js';

export interface OrganizationRepository {
  listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<Team[]>;
  listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
  }): Promise<Collaborator[]>;
  findCollaboratorById(id: string): Promise<Collaborator | null>;
  findCollaboratorByEmail(email: string): Promise<Collaborator | null>;

  createTeam(data: TeamWriteData): Promise<Team>;
  updateTeam(id: string, data: TeamWriteData): Promise<Team>;
  deleteTeam(id: string): Promise<void>;

  createCollaborator(data: CollaboratorWriteData): Promise<Collaborator>;
  updateCollaborator(id: string, data: CollaboratorWriteData): Promise<Collaborator>;
  deleteCollaborator(id: string): Promise<void>;

  toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }): Promise<void>;
}
