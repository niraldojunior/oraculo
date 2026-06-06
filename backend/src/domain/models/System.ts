export interface System {
  id: string;
  companyId: string;
  departmentId: string;
  name: string;
  platformName?: string | null;
  domain: string;
  subDomain?: string | null;
  criticality: string;
  techStack: string[];
  ownerTeamId?: string | null;
  smeId?: string | null;
  lifecycleStatus: string;
  debtScore: number;
  description: string;
  platformCategory?: string | null;
  vendorId?: string | null;
  repoUrl?: string | null;
  environments?: unknown;
  contextFiles?: unknown;
}

export type SystemWriteData = Partial<Omit<System, 'id'>>;