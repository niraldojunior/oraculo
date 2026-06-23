export interface Department {
  id: string;
  name: string;
  companyId: string;
  masterUserId?: string | null;
}

export interface DepartmentMasterUser {
  name: string;
  email: string;
  password?: string;
  photoUrl?: string;
}

export type DepartmentWriteData = Partial<Omit<Department, 'id'>>;
