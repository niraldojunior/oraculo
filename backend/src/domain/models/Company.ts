export interface Company {
  id: string;
  fantasyName: string;
  realName: string;
  logo: string;
  description: string;
}

export type CompanyWriteData = Partial<Omit<Company, 'id'>>;