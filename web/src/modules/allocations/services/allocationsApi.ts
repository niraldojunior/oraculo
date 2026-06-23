import { getJson } from '@/shared/http/apiClient';
import type { Collaborator, Initiative, Team } from '../../../types';

export interface AllocationsScope {
  companyId: string;
  departmentId?: string;
}

export interface AllocationsPageData {
  initiatives: Initiative[];
  collaborators: Collaborator[];
  teams: Team[];
}

export async function fetchAllocationsPageData(scope: AllocationsScope): Promise<AllocationsPageData> {
  const scopedQuery = {
    companyId: scope.companyId,
    departmentId: scope.departmentId
  };

  const [initiatives, collaborators, teams] = await Promise.all([
    getJson<Initiative[]>('/api/initiatives', scopedQuery),
    getJson<Collaborator[]>('/api/collaborators', { companyId: scope.companyId }),
    getJson<Team[]>('/api/teams', scopedQuery)
  ]);

  return {
    initiatives: Array.isArray(initiatives) ? initiatives : [],
    collaborators: Array.isArray(collaborators) ? collaborators : [],
    teams: Array.isArray(teams) ? teams : []
  };
}
