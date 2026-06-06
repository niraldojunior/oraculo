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
}

export type ContractWriteData = Partial<Omit<Contract, 'id'>>;