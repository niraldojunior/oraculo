import { getJson } from '@/shared/http/apiClient';
import type { Collaborator, Contract, Initiative, System, Team, Vendor } from '@/types';

export interface DashboardScope {
  companyId?: string;
  departmentId?: string;
}

export interface DashboardData {
  systems: System[];
  collaborators: Collaborator[];
  initiatives: Initiative[];
  contracts: Contract[];
  teams: Team[];
  vendors: Vendor[];
}

function withQuery(scope: DashboardScope, lite?: boolean) {
  const params = new URLSearchParams();
  if (scope.companyId) params.set('companyId', scope.companyId);
  if (scope.departmentId) params.set('departmentId', scope.departmentId);
  if (lite) params.set('lite', 'true');
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export async function fetchDashboardData(scope: DashboardScope): Promise<DashboardData> {
  const query = withQuery(scope);
  const liteQuery = withQuery(scope, true);

  const [systems, collaborators, initiatives, contracts, teams, vendors] = await Promise.all([
    getJson<System[]>(`/api/systems${query}`),
    getJson<Collaborator[]>(`/api/collaborators${liteQuery}`),
    getJson<Initiative[]>(`/api/initiatives${liteQuery}`),
    getJson<Contract[]>(`/api/contracts${query}`),
    getJson<Team[]>(`/api/teams${query}`),
    getJson<Vendor[]>(`/api/vendors${liteQuery}`)
  ]);

  return {
    systems: Array.isArray(systems) ? systems : [],
    collaborators: Array.isArray(collaborators) ? collaborators : [],
    initiatives: Array.isArray(initiatives) ? initiatives : [],
    contracts: Array.isArray(contracts) ? contracts : [],
    teams: Array.isArray(teams) ? teams : [],
    vendors: Array.isArray(vendors) ? vendors : []
  };
}
