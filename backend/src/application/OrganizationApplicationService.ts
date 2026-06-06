import type {
  CollaboratorWriteData,
  OrganizationRepository,
  TeamWriteData
} from '../domain/repositories/OrganizationRepository.js';

export class OrganizationApplicationService {
  private readonly repository: OrganizationRepository;

  constructor(repository: OrganizationRepository) {
    this.repository = repository;
  }

  async createTeam(data: TeamWriteData) {
    return this.repository.createTeam(data);
  }

  async listTeamsByScope(scope: { companyId?: string; departmentId?: string }) {
    return this.repository.listTeamsByScope(scope);
  }

  async updateTeam(id: string, data: TeamWriteData) {
    return this.repository.updateTeam(id, data);
  }

  async deleteTeam(id: string) {
    await this.repository.deleteTeam(id);
  }

  async createCollaborator(data: CollaboratorWriteData) {
    return this.repository.createCollaborator(data);
  }

  async listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    safeSelect: any;
    dashboardSelect: any;
  }) {
    const collaborators = await this.repository.listCollaboratorsByScope(params);
    return collaborators.map((c: any) => ({
      ...c,
      role: (c.role === 'Engineer/Analyst' || c.role === 'ENGINEER/ANALYST') ? 'Engineer' : c.role
    }));
  }

  async findCollaboratorById(id: string) {
    return this.repository.findCollaboratorById(id);
  }

  async findCollaboratorByEmail(email: string) {
    return this.repository.findCollaboratorByEmail(email);
  }

  async updateCollaborator(id: string, data: CollaboratorWriteData) {
    return this.repository.updateCollaborator(id, data);
  }

  async deleteCollaborator(id: string) {
    await this.repository.deleteCollaborator(id);
  }

  async toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }) {
    await this.repository.toggleCollaboratorSkill(params);
  }
}
