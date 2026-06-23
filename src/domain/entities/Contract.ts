export interface Contract {
  id: string;
  companyId: string;
  departmentId: string;
  vendorId: string;
  number: string;
  startDate: string;
  endDate: string;
  model: string;
  annualCost: number;
  name?: string | null;
  description?: string | null;
  status?: string;
  systemId?: string | null;
  leaderId?: string | null;
}

export type ContractWriteData = Partial<Omit<Contract, 'id'>>;
