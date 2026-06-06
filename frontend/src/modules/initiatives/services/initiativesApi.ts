import { getJson } from '../../../core/http/apiClient';
import type { Collaborator, Initiative, System, Team } from '../../../core/types';

export interface InitiativesPageData {
  initiatives: Initiative[];
  collaborators: Collaborator[];
  systems: System[];
  teams: Team[];
}

export interface InitiativeEditorContextData {
  collaborators: Collaborator[];
  systems: System[];
}

export async function fetchInitiativesPageData(scope: {
  companyId: string;
  departmentId?: string;
}): Promise<InitiativesPageData> {
  const commonQuery = {
    companyId: scope.companyId,
    departmentId: scope.departmentId
  };

  const [initiatives, collaborators, systems, teams] = await Promise.all([
    getJson<Initiative[]>('/api/initiatives', commonQuery),
    getJson<Collaborator[]>('/api/collaborators', { companyId: scope.companyId }),
    getJson<System[]>('/api/systems', { companyId: scope.companyId }),
    getJson<Team[]>('/api/teams', commonQuery)
  ]);

  return {
    initiatives: Array.isArray(initiatives) ? initiatives : [],
    collaborators: Array.isArray(collaborators) ? collaborators : [],
    systems: Array.isArray(systems) ? systems : [],
    teams: Array.isArray(teams) ? teams : []
  };
}

export async function fetchInitiativeEditorContext(): Promise<InitiativeEditorContextData> {
  const data = await getJson<Partial<InitiativeEditorContextData>>('/api/inventory-context');
  return {
    collaborators: Array.isArray(data?.collaborators) ? data.collaborators : [],
    systems: Array.isArray(data?.systems) ? data.systems : []
  };
}

export async function fetchInitiativeById(id: string): Promise<Initiative> {
  return getJson<Initiative>(`/api/initiatives/${id}`);
}

export async function fetchInitiativeHistory(id: string): Promise<any[]> {
  try {
    const history = await getJson<any[]>(`/api/initiatives/${id}/history`);
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

export async function fetchInitiativeComments(id: string): Promise<any[]> {
  try {
    const comments = await getJson<any[]>(`/api/initiatives/${id}/comments`);
    return Array.isArray(comments) ? comments : [];
  } catch {
    return [];
  }
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

export async function createInitiative(payload: Partial<Initiative> & { updatedBy?: string }): Promise<Initiative> {
  return requestJson<Initiative>('/api/initiatives', 'POST', payload);
}

export async function updateInitiative(id: string, payload: Partial<Initiative> & { updatedBy?: string }): Promise<Initiative> {
  return requestJson<Initiative>(`/api/initiatives/${id}`, 'PATCH', payload);
}

export async function deleteInitiative(id: string): Promise<void> {
  await requestJson<void>(`/api/initiatives/${id}`, 'DELETE');
}

export async function deleteInitiatives(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => deleteInitiative(id)));
}

export async function updateInitiativePriority(id: string, priority: number): Promise<Initiative> {
  return requestJson<Initiative>(`/api/initiatives/${id}`, 'PATCH', { priority });
}
