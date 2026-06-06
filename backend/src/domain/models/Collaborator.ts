export interface Collaborator {
  id: string;
  companyId: string;
  departmentId: string;
  name: string;
  email: string;
  role: string;
  squadId?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  isAdmin: boolean;
  vacationStart?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  birthday?: string | null;
  uf?: string | null;
  associatedCompanyIds: string[];
}

export interface Absence {
  id: string;
  collaboratorId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string | null;
}

export type CollaboratorWriteData = Partial<Omit<Collaborator, 'id'>>;