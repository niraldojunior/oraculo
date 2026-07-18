import { getJson } from '@/shared/http/apiClient';
import type { Absence, BusinessUnit, ClientTeam, Collaborator, Department, Holiday, Skill, Team } from '@/types';

export interface OrganizationScope {
  companyId?: string;
  departmentId?: string;
}

export interface OrganizationPageData {
  teams: Team[];
  collaborators: Collaborator[];
  departments: Department[];
  absences: Absence[];
  holidays: Holiday[];
}

function withQuery(basePath: string, params: OrganizationScope) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `${basePath}?${serialized}` : basePath;
}

async function requestJson<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', payload?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined
  });

  if (!response.ok) {
    let details = '';
    try {
      const errorBody = await response.json();
      details = errorBody?.details || errorBody?.error || '';
    } catch {
      // keep default message
    }
    const suffix = details ? `: ${details}` : '';
    throw new Error(`${method} ${path} failed with status ${response.status}${suffix}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchOrganizationPageData(scope: OrganizationScope): Promise<OrganizationPageData> {
  const query = withQuery('', scope).slice(1);
  const collabParams = new URLSearchParams();
  if (scope.companyId) collabParams.set('companyId', scope.companyId);
  if (scope.departmentId) collabParams.set('departmentId', scope.departmentId);
  const collabSerialized = collabParams.toString();
  const collabQuery = collabSerialized ? `?${collabSerialized}` : '';
  const deptQuery = scope.companyId ? `?companyId=${encodeURIComponent(scope.companyId)}` : '';
  const resourceQuery = query ? `?${query}` : '';

  const [teams, collaborators, departments, absences, holidays] = await Promise.all([
    getJson<Team[]>(`/api/teams${resourceQuery}`),
    getJson<Collaborator[]>(`/api/collaborators${collabQuery}`),
    getJson<Department[]>(`/api/departments${deptQuery}`),
    getJson<Absence[]>(`/api/absences${resourceQuery}`),
    getJson<Holiday[]>(`/api/holidays${resourceQuery}`)
  ]);

  return {
    teams: Array.isArray(teams) ? teams : [],
    collaborators: Array.isArray(collaborators) ? collaborators : [],
    departments: Array.isArray(departments) ? departments : [],
    absences: Array.isArray(absences) ? absences : [],
    holidays: Array.isArray(holidays) ? holidays : []
  };
}

export async function fetchOrganizationSkills(scope: OrganizationScope): Promise<Skill[]> {
  const path = withQuery('/api/skills', scope);
  const skills = await getJson<Skill[]>(path);
  return Array.isArray(skills) ? skills : [];
}

export async function saveTeam(team: Team): Promise<Team> {
  const hasPersistentId = Boolean(team.id) && !String(team.id).startsWith('t_');

  if (!hasPersistentId) {
    const { id: _discardedDraftId, ...payload } = team as Team & { id?: string };
    return requestJson<Team>('/api/teams', 'POST', payload);
  }

  return requestJson<Team>(`/api/teams/${team.id}`, 'PATCH', team);
}

export async function deleteTeam(id: string): Promise<void> {
  await requestJson<void>(`/api/teams/${id}`, 'DELETE');
}

export async function saveCollaborator(collaborator: Collaborator): Promise<Collaborator> {
  const exists = Boolean(collaborator.id);
  return requestJson<Collaborator>(exists ? `/api/collaborators/${collaborator.id}` : '/api/collaborators', exists ? 'PATCH' : 'POST', collaborator);
}

export async function deleteCollaborator(id: string): Promise<void> {
  await requestJson<void>(`/api/collaborators/${id}`, 'DELETE');
}

export async function saveSkill(skill: any): Promise<Skill> {
  const exists = Boolean(skill.id);
  return requestJson<Skill>(exists ? `/api/skills/${skill.id}` : '/api/skills', exists ? 'PATCH' : 'POST', skill);
}

export async function deleteSkill(id: string): Promise<void> {
  await requestJson<void>(`/api/skills/${id}`, 'DELETE');
}

export async function saveAbsence(absence: any): Promise<Absence> {
  const exists = Boolean(absence.id);
  return requestJson<Absence>(exists ? `/api/absences/${absence.id}` : '/api/absences', exists ? 'PATCH' : 'POST', absence);
}

export async function deleteAbsence(id: string): Promise<void> {
  await requestJson<void>(`/api/absences/${id}`, 'DELETE');
}

export async function saveHoliday(holiday: any): Promise<Holiday> {
  const exists = Boolean(holiday.id);
  return requestJson<Holiday>(exists ? `/api/holidays/${holiday.id}` : '/api/holidays', exists ? 'PATCH' : 'POST', holiday);
}

export async function deleteHoliday(id: string): Promise<void> {
  await requestJson<void>(`/api/holidays/${id}`, 'DELETE');
}

export async function fetchBusinessUnits(scope: OrganizationScope): Promise<BusinessUnit[]> {
  const path = withQuery('/api/business-units', scope);
  const units = await getJson<BusinessUnit[]>(path);
  return Array.isArray(units) ? units : [];
}

export async function saveBusinessUnit(unit: Partial<BusinessUnit> & { id?: string }): Promise<BusinessUnit> {
  const exists = Boolean(unit.id);
  return requestJson<BusinessUnit>(exists ? `/api/business-units/${unit.id}` : '/api/business-units', exists ? 'PATCH' : 'POST', unit);
}

export async function deleteBusinessUnit(id: string): Promise<void> {
  await requestJson<void>(`/api/business-units/${id}`, 'DELETE');
}

export async function fetchClientTeams(scope: OrganizationScope): Promise<ClientTeam[]> {
  const path = withQuery('/api/client-teams', scope);
  const teams = await getJson<ClientTeam[]>(path);
  return Array.isArray(teams) ? teams : [];
}

export async function saveClientTeam(team: Partial<ClientTeam> & { id?: string }): Promise<ClientTeam> {
  const exists = Boolean(team.id);
  return requestJson<ClientTeam>(exists ? `/api/client-teams/${team.id}` : '/api/client-teams', exists ? 'PATCH' : 'POST', team);
}

export async function deleteClientTeam(id: string): Promise<void> {
  await requestJson<void>(`/api/client-teams/${id}`, 'DELETE');
}

export async function includeCollaboratorsInTeam(teamId: string, collaborators: Collaborator[], memberIds: string[]): Promise<Collaborator[]> {
  await Promise.all(memberIds.map(id => {
    const collaborator = collaborators.find(item => item.id === id);
    if (!collaborator) return Promise.resolve();
    return saveCollaborator({ ...collaborator, squadId: teamId });
  }));
  return getJson<Collaborator[]>('/api/collaborators');
}

export async function removeCollaboratorFromTeam(collaborator: Collaborator): Promise<Collaborator> {
  return saveCollaborator({ ...collaborator, squadId: null });
}
