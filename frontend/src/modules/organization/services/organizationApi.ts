import { getJson } from '../../../core/http/apiClient';
import type { Absence, Collaborator, Department, Holiday, Skill, Team } from '../../../core/types';

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
  const collabQuery = scope.companyId ? `?companyId=${encodeURIComponent(scope.companyId)}` : '';
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
  const exists = Boolean(team.id);
  return requestJson<Team>(exists ? `/api/teams/${team.id}` : '/api/teams', exists ? 'PATCH' : 'POST', team);
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
