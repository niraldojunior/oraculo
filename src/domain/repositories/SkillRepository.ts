import type { Skill, SkillWriteData } from '../entities/Skill.js';

export interface SkillRepository {
  listSkills(scope: { companyId?: string; departmentId?: string }): Promise<Skill[]>;
  createSkill(data: SkillWriteData, memberIds?: string[]): Promise<Skill>;
  updateSkill(id: string, data: SkillWriteData, memberIds?: string[]): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;
}
