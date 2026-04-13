export type AppRole = 'Master' | 'Director' | 'Head' | 'Manager' | 'Lead Engineer' | 'Engineer' | 'Analyst' | 'QA';
export type TeamType = 'Master' | 'Head' | 'Diretoria' | 'Gerencia' | 'Lideranca';
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

export interface Skill {
  id: string;
  name: string;
  description: string;
  familia?: string;
  icon?: string;
  category: 'Technical' | 'Functional';
  companyId: string;
  departmentId: string;
  collaborators?: {
    collaborator: Collaborator;
  }[];
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



export type Collaborator = {
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
  associatedCompanyIds: string[];
  skills: { skill: Skill }[];
  birthday?: string; // format: MM-DD
  vacationStart?: string; // format: YYYY-MM-DD
  startDate?: string; // format: YYYY-MM-DD
  endDate?: string; // format: YYYY-MM-DD
  uf?: string; // UF do colaborador (ex: SP, RJ, MG)
};

export type User = Collaborator;

export interface Team {
  companyId: string;
  departmentId: string;
  id: string;
  name: string;
  type: TeamType;
  parentTeamId: string | null;
  leaderId: string | null;
  receivesInitiatives: boolean;
}



export interface Absence {
  id: string;
  collaboratorId: string;
  startDate: string;
  endDate: string;
  type: string; // Férias, Folga, Licença Médica, etc.
  reason?: string;
  collaborator?: Collaborator;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  companyId?: string;
  scope?: 'nacional' | 'estadual';
  uf?: string; // UF do feriado estadual
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
  priority: string;
  healthStatus: HealthStatus;
  ownerId: string;
  affectedSystems: string[];
}

export type InitiativeType = 
  | '1- Estratégico' 
  | '2- Projeto' 
  | '3- Fast Track';

export type MilestoneTaskType = 'Feature' | 'Melhoria' | 'Bug' | 'Debito Técnico' | 'Enabler' | 'DRI' | 'Ambiente';
export type TaskStatus = 'Backlog' | 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'Canceled' | 'Duplicate';
export const TASK_STATUS_ORDER: TaskStatus[] = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done', 'Canceled', 'Duplicate'];
export type BenefitType = 'Aumento Receita' | 'Redução Despesa' | 'Redução Custos' | 'Estratégico' | 'Regulatório' | 'Risco de Continuidade';

export type MilestoneStatus = 
  | '1- Backlog' 
  | '2- Discovery' 
  | '3- Planejamento' 
  | '4- Execução'
  | '5- Implantação'
  | '6- Concluído'
  | 'Suspenso'
  | 'Cancelado';

export const MILESTONE_STATUSES: MilestoneStatus[] = [
  '1- Backlog',
  '2- Discovery',
  '3- Planejamento',
  '4- Execução',
  '5- Implantação',
  '6- Concluído',
  'Suspenso',
  'Cancelado'
];

export interface InitiativeComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  timestamp: string;
}

export interface InitiativeHistory {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  fromStatus?: MilestoneStatus;
  toStatus?: MilestoneStatus;
  notes?: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  timestamp: string;
}

export interface MilestoneTask {
  id: string;
  name: string;
  status: TaskStatus;
  type?: MilestoneTaskType | null;
  assigneeId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  systemId?: string | null;
  systemIds?: string[];
  milestoneId: string;
  priority?: number;
  notes?: string;
  comments?: TaskComment[];
}

export interface InitiativeMilestone {
  companyId: string;
  departmentId: string;
  id: string;
  name: string;
  systemId?: string;
  baselineDate?: string;
  realDate?: string;
  description?: string;
  assignedEngineerId?: string;
  startDate?: string;
  endDate?: string;
  tasks?: MilestoneTask[];
}

export interface Initiative {
  companyId: string;
  departmentId: string;
  id: string;
  title: string;
  type: InitiativeType;
  benefit: string;
  benefitType?: BenefitType;
  rationale?: string;
  scope: string;
  macroScope?: string[];
  premises?: string;
  requirements?: string;
  customerOwner: string;
  originDirectorate: string;
  requesterId?: string;
  directorId?: string;
  leaderId: string;
  technicalLeadId?: string;
  impactedSystemIds: string[];
  milestones: InitiativeMilestone[];
  createdAt: string;
  businessExpectationDate?: string;
  status: MilestoneStatus;
  previousStatus?: MilestoneStatus;
  history: InitiativeHistory[];
  comments?: InitiativeComment[];
  executingDirectorate?: string;
  executingTeamId?: string;
  createdById?: string;
  assignedManagerId?: string;
  initiativeType?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  memberIds?: string[];

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
  initiativeId: string;
  collaboratorId: string;
  percentage: number;
  startDate: string;
  endDate: string;
}

export interface CapacitySummary {
  collaboratorId: string;
  collaboratorName: string;
  role: AppRole;
  totalLoad: number;
  allocations: {
    initiativeId: string;
    initiativeTitle: string;
    percentage: number;
  }[];
}

