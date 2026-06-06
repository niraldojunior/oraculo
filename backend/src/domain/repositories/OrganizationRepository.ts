import type { Collaborator, CollaboratorWriteData } from '../models/Collaborator.js';
import type { Team, TeamWriteData } from '../models/Team.js';

export type { TeamWriteData, CollaboratorWriteData };

export interface OrganizationRepository {
  listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<Team[]>;
  listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    safeSelect: unknown;
    dashboardSelect: unknown;
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
