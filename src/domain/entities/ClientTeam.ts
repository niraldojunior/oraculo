export interface ClientTeam {
  id: string;
  name: string;
  companyId: string;
  departmentId: string;
  businessUnitId?: string | null;
  businessUnitName?: string | null;
}

export type ClientTeamWriteData = Partial<Omit<ClientTeam, 'id' | 'businessUnitName'>>;
