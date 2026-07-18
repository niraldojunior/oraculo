export interface BusinessUnit {
  id: string;
  name: string;
  companyId: string;
  departmentId: string;
}

export type BusinessUnitWriteData = Partial<Omit<BusinessUnit, 'id'>>;
