export interface Team {
  id: string;
  companyId: string;
  departmentId: string;
  name: string;
  type: string;
  parentTeamId?: string | null;
  leaderId?: string | null;
  receivesInitiatives: boolean;
}

export type TeamWriteData = Partial<Omit<Team, 'id'>>;