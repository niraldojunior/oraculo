export interface System {
  id: string;
  companyId: string;
  departmentId: string;
  name: string;
  category?: string | null;
  criticality: string;
  ownerTeamId?: string | null;
  lifecycleStatus: string;
  debtScore: number;
  description: string;
  environments?: unknown;
  contextFiles?: unknown;
}

export type SystemWriteData = Partial<Omit<System, 'id'>>;