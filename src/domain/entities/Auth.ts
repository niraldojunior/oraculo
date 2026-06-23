export interface AuthUser {
  id: string;
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  companyId: string;
  departmentId: string;
  role: string;
  associatedCompanyIds: string[];
}

export interface LoginResult {
  user: AuthUser;
  isAdmin: boolean;
  type: 'collaborator';
}
