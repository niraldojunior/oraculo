export interface Skill {
  id: string;
  name: string;
  description: string;
  familia?: string | null;
  icon?: string | null;
  companyId: string;
  departmentId: string;
}

export interface CollaboratorSkill {
  collaboratorId: string;
  skillId: string;
}

export type SkillWriteData = Partial<Omit<Skill, 'id'>>;