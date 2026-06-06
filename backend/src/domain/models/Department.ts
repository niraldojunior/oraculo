export interface Department {
  id: string;
  name: string;
  companyId: string;
  masterUserId?: string | null;
}

export type DepartmentWriteData = Partial<Omit<Department, 'id'>>;