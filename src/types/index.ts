export type AppRole = 'Head' | 'Director' | 'Manager' | 'Lead Engineer' | 'Engineer/Analyst';
export type TeamType = 'Head' | 'Diretoria' | 'Gerencia' | 'Lideranca';
export type Proficiency = 'Junior' | 'Pleno' | 'Senior';
export type HealthStatus = 'Green' | 'Amber' | 'Red';
export type SLA = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface Company {
  id: string;
  fantasyName: string;
  realName: string;
  logo: string;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
  masterUser?: {
    name: string;
    email: string;
    password?: string;
  };
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  photoUrl?: string;
  associatedCompanyIds: string[];
  departmentId?: string; // Current department
  role: AppRole;
}

export interface Collaborator {
  companyId: string;
  departmentId: string;
  id: string;
  name: string;
  email: string;
  role: AppRole;
  squadId: string | null;
  photoUrl?: string;
  phone?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  password?: string;
  isAdmin?: boolean;
  skills: { skillId: string; level: Proficiency }[];
}

export interface Team {
  companyId: string;
  departmentId: string;
  id: string;
  name: string;
  type: TeamType;
  parentTeamId: string | null;
  leaderId: string | null;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Technical' | 'Functional';
}

export interface Absence {
  id: string;
  collaboratorId: string;
  startDate: string;
  endDate: string;
  type: 'Vacation' | 'Sick Leave' | 'Training';
}

export interface Vendor {
  companyId: string;
  departmentId: string;
  id: string;
  companyName: string;
  taxId: string;
  type: string;
  logoUrl?: string;
  directorId?: string;
  managerId?: string;
}

export interface Contract {
  companyId: string;
  departmentId: string;
  id: string;
  vendorId: string;
  number: string;
  startDate: string;
  endDate: string;
  model: string;
  annualCost: number; // in BRL
}

export interface SystemContextFile {
  name: string;
  type: string; // MIME type
  dataUrl: string; // base64 data URL
}

export interface System {
  companyId: string;
  departmentId: string;
  id: string;
  name: string;
  platformName?: string;
  acronym?: string;
  domain: string;
  subDomain?: string;
  platformCategory?: string;
  criticality: SLA;
  techStack: string[];
  ownerTeamId: string;
  smeId: string;
  lifecycleStatus: 'Ativo Greenfield' | 'Fim de Vida (Freezing)' | 'Planejado';
  debtScore: number; // 0 to 10
  description: string;
  vendorId?: string;
  repoUrl?: string;
  contextFiles?: SystemContextFile[];
  environments?: {
    dev?: string;
    ti?: string;
    hml?: string;
    prd?: string;
  };
}

export interface Integration {
  companyId: string;
  departmentId: string;
  id: string;
  sourceId: string;
  targetId: string;
  protocol: 'API Rest' | 'SOAP' | 'Kafka' | 'SFTP';
}

export interface RoadmapInitiative {
  id: string;
  name: string;
  description: string;
  priority: 'Estratégico' | 'Projeto' | 'Fast Track' | 'Roadmap Tecnico' | 'Vulnerabilidade' | 'PBI';
  healthStatus: HealthStatus;
  ownerId: string; // leader
  affectedSystems: string[];
}

export type InitiativeType = 'Estratégico' | 'Projeto' | 'Fast Track' | 'Vulnerabilidade' | 'Problema' | 'PBI' | 'Roadmap Tecnológico';
export type BenefitType = 'Aumento Receita' | 'Redução Custos' | 'Risco Continuidade' | 'Regulatório';

export type MilestoneStatus = 
  | '1- Em Avaliação' 
  | '2- Em Backlog' 
  | '3- Em Planejamento' 
  | '4- Em Execução'
  | '5- Entregue'
  | 'Suspenso'
  | 'Cancelado';

export const MILESTONE_STATUSES: MilestoneStatus[] = [
  '1- Em Avaliação',
  '2- Em Backlog',
  '3- Em Planejamento',
  '4- Em Execução',
  '5- Entregue',
  'Suspenso',
  'Cancelado'
];

export interface InitiativeHistory {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  fromStatus?: MilestoneStatus;
  toStatus?: MilestoneStatus;
  notes?: string;
}

export interface InitiativeMilestone {
  companyId: string;
  departmentId: string;
  id: string;
  name: string;
  systemId: string;
  baselineDate: string;
  realDate?: string;
  description?: string;
  assignedEngineerId?: string; // NOVO: Para o milestone de desenvolvimento
  startDate?: string; // NOVO: Para o milestone de desenvolvimento
}

export interface Initiative {
  companyId: string;
  departmentId: string;
  id: string;
  title: string;
  type: InitiativeType;
  benefit: string;
  benefitType?: BenefitType;
  scope: string;
  customerOwner: string;
  originDirectorate: string;
  leaderId: string; // Gerente Lider
  technicalLeadId?: string; // Lider Tecnico
  impactedSystemIds: string[];
  milestones: InitiativeMilestone[];
  createdAt: string;
  businessExpectationDate?: string;
  status: MilestoneStatus;
  previousStatus?: MilestoneStatus;
  history: InitiativeHistory[]; // NOVO: Trilha de auditoria
}

export interface Milestone {
  companyId: string;
  departmentId: string;
  id: string;
  initiativeId: string;
  name: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface Allocation {
  companyId: string;
  departmentId: string;
  id: string;
  collaboratorId: string;
  initiativeId: string | 'BAU'; // BAU stands for Business As Usual / Sustentação
  systemId?: string; // Optional if tied directly to a system maintenance
  percentage: number;
  startDate: string;
  endDate: string;
}
