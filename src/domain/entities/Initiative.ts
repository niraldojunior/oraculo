import type { ClientTeam } from './ClientTeam.js';

/**
 * Status possíveis de uma iniciativa, na ordem do fluxo de trabalho.
 *
 * Os três últimos (`Backlog`, `In Progress`, `Done`) são legados de antes da
 * numeração e continuam aceitos porque existem registros com esses valores.
 * Fonte de verdade para o `@IsEnum` de `CreateInitiativeDto` — o DTO deriva
 * desta lista em vez de repetir os literais.
 */
export const INITIATIVE_STATUSES = [
  '1- Backlog',
  '2- Discovery',
  '3- Planejamento',
  '4- Aguardando Capacidade',
  '5- Construção',
  '6- QA',
  '7- UAT',
  '8- Implantação',
  '9- Concluído',
  'Suspenso',
  'Cancelado',
  'Backlog',
  'In Progress',
  'Done'
] as const;

export type InitiativeStatus = (typeof INITIATIVE_STATUSES)[number];

export interface Initiative {
  id: string;
  title: string;
  priority: number;
  status: InitiativeStatus;
  companyId?: string;
  departmentId?: string;
  createdAt: Date;
  type?: string;
  benefit?: string;
  benefitType?: string;
  scope?: string;
  customerOwner?: string;
  clientTeamId?: string | null;
  clientTeam?: ClientTeam | null;
  /** @deprecated Alias de leitura derivado de clientTeam.name. */
  originDirectorate?: string;
  leaderId?: string;
  technicalLeadId?: string;
  impactedSystemIds?: string[];
  macroScope?: string[];
  requestDate?: string;
  businessExpectationDate?: string;
  previousStatus?: string;
  executingTeamId?: string;
  executingDirectorate?: string;
  rationale?: string;
  externalLinkType?: string;
  externalLinkName?: string;
  externalLinkUrl?: string;
  createdById?: string;
  assignedManagerId?: string;
  initiativeType?: string;
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  memberIds?: string[];
  milestones?: unknown[];
  comments?: unknown[];
  history?: unknown[];
}
