export interface Allocation {
  id: string;
  companyId: string;
  departmentId: string;
  collaboratorId: string;
  initiativeId: string;
  systemId?: string | null;
  percentage: number;
  startDate: string;
  endDate: string;
}

export type AllocationWriteData = Partial<Omit<Allocation, 'id'>>;