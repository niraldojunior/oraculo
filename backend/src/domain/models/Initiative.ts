export type InitiativeStatus =
  | '1- Backlog'
  | '2- Discovery'
  | '3- Planejamento'
  | '4- Aguardando Capacidade'
  | '5- Construção'
  | '6- QA'
  | '7- UAT'
  | '8- Implantação'
  | '9- Concluído'
  | 'Suspenso'
  | 'Cancelado';

export type TaskStatus =
  | 'Backlog'
  | 'Todo'
  | 'In Progress'
  | 'In Review'
  | 'Done'
  | 'Canceled'
  | 'Duplicate';

export type MilestoneTaskType =
  | 'Feature'
  | 'Melhoria'
  | 'Bug'
  | 'Debito Técnico'
  | 'Enabler'
  | 'DRI'
  | 'Ambiente'
  | 'Release';

export interface InitiativeComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  content: string;
  timestamp: string;
}

export interface InitiativeHistory {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  fromStatus?: InitiativeStatus;
  toStatus?: InitiativeStatus;
  notes?: string | null;
}

export interface TaskHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  type: 'comment' | 'change';
  content?: string;
  field?: string;
  from?: string;
  to?: string;
}

export interface MilestoneTask {
  id: string;
  name: string;
  status: TaskStatus;
  type?: MilestoneTaskType | null;
  assigneeId?: string | null;
  systemId?: string | null;
  systemIds?: string[];
  priority?: number;
  startDate?: string | null;
  targetDate?: string | null;
  notes?: string | null;
  order?: number | null;
  milestoneId: string;
  taskHistory?: TaskHistoryEntry[];
}

export interface InitiativeMilestone {
  id: string;
  name: string;
  initiativeId: string;
  systemId?: string | null;
  baselineDate?: string | null;
  realDate?: string | null;
  description?: string | null;
  assignedEngineerId?: string | null;
  startDate?: string | null;
  order?: number | null;
  tasks?: MilestoneTask[];
}

export interface Initiative {
  id: string;
  title: string;
  type?: string;
  benefit?: string;
  benefitType?: string | null;
  scope?: string;
  customerOwner?: string;
  originDirectorate?: string;
  leaderId?: string | null;
  technicalLeadId?: string | null;
  impactedSystemIds?: string[];
  companyId: string;
  departmentId: string;
  status: InitiativeStatus;
  previousStatus?: string | null;
  executingTeamId?: string | null;
  executingDirectorate?: string | null;
  rationale?: string | null;
  assignedManagerId?: string | null;
  initiativeType?: string | null;
  memberIds?: string[];
  startDate?: string | null;
  endDate?: string | null;
  actualEndDate?: string | null;
  priority?: number;
  milestones?: InitiativeMilestone[];
  history?: InitiativeHistory[];
  comments?: InitiativeComment[];
  createdAt: Date;
}

export type InitiativeWriteData = Partial<Omit<Initiative, 'id' | 'createdAt'>>;
