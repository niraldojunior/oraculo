import { Inject, Injectable } from '@nestjs/common';
import type { Skill, SkillWriteData } from '../../domain/entities/Skill.js';
import { SKILL_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { SkillRepository } from '../../domain/repositories/SkillRepository.js';

@Injectable()
export class SkillService {
  constructor(
    @Inject(SKILL_REPOSITORY)
    private readonly repository: SkillRepository
  ) {}

  listSkills(scope: { companyId?: string; departmentId?: string }): Promise<Skill[]> {
    return this.repository.listSkills(scope);
  }

  createSkill(data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
    return this.repository.createSkill(data, memberIds);
  }

  updateSkill(id: string, data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
    return this.repository.updateSkill(id, data, memberIds);
  }

  deleteSkill(id: string): Promise<void> {
    return this.repository.deleteSkill(id);
  }
}
