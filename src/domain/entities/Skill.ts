export interface SkillCollaboratorLink {
  collaborator: {
    id: string;
    name: string;
    photoUrl?: string | null;
    role: string;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  familia?: string | null;
  icon?: string | null;
  companyId: string;
  departmentId: string;
  collaborators?: SkillCollaboratorLink[];
}

export type SkillWriteData = Partial<Omit<Skill, 'id' | 'collaborators'>>;
