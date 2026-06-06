import type { SkillRepository, SkillWriteData } from '../domain/repositories/SkillRepository.js';

export class SkillApplicationService {
  private readonly repository: SkillRepository;

  constructor(repository: SkillRepository) {
    this.repository = repository;
  }

  async listSkills(scope: { companyId?: string; departmentId?: string }) {
    return this.repository.listSkills(scope);
  }

  async createSkill(data: SkillWriteData, memberIds?: string[]) {
    return this.repository.createSkill(data, memberIds);
  }

  async updateSkill(id: string, data: SkillWriteData, memberIds?: string[]) {
    return this.repository.updateSkill(id, data, memberIds);
  }

  async deleteSkill(id: string) {
    await this.repository.deleteSkill(id);
  }
}