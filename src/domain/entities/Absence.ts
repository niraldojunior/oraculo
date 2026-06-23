export interface AbsenceCollaborator {
  id: string;
  companyId: string;
  departmentId: string;
  squadId?: string | null;
  name: string;
  email: string;
  role: string;
}

export interface Absence {
  id: string;
  collaboratorId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string | null;
  collaborator?: AbsenceCollaborator;
}

export type AbsenceWriteData = Partial<Omit<Absence, 'id'>>;
