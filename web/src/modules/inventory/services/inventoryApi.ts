import { getJson } from '@/shared/http/apiClient';
import type { Collaborator, Department, System, Team, Vendor } from '../../../types';

export interface InventoryScope {
  companyId: string;
  departmentId?: string;
}

export interface InventoryContextData {
  systems: System[];
  teams: Team[];
  collaborators: Collaborator[];
  vendors: Vendor[];
  departments: Department[];
}

export interface InventoryDetailData {
  system: System | null;
  teams: Team[];
  collaborators: Collaborator[];
  vendors: Vendor[];
}

function normalizeInventoryContext(payload: Partial<InventoryContextData> | null | undefined): InventoryContextData {
  return {
    systems: Array.isArray(payload?.systems) ? payload.systems : [],
    teams: Array.isArray(payload?.teams) ? payload.teams : [],
    collaborators: Array.isArray(payload?.collaborators) ? payload.collaborators : [],
    vendors: Array.isArray(payload?.vendors) ? payload.vendors : [],
    departments: Array.isArray(payload?.departments) ? payload.departments : []
  };
}

export async function fetchInventoryContext(scope?: InventoryScope): Promise<InventoryContextData> {
  const query = scope
    ? {
        companyId: scope.companyId,
        departmentId: scope.departmentId
      }
    : undefined;

  const data = await getJson<Partial<InventoryContextData>>('/api/inventory-context', query);
  return normalizeInventoryContext(data);
}

export async function fetchInventoryDetailData(systemId: string): Promise<InventoryDetailData> {
  const [systemResult, teamsResult, collaboratorsResult, vendorsResult] = await Promise.allSettled([
    getJson<System>(`/api/systems/${systemId}`),
    getJson<Team[]>('/api/teams'),
    getJson<Collaborator[]>('/api/collaborators'),
    getJson<Vendor[]>('/api/vendors')
  ]);

  return {
    system: systemResult.status === 'fulfilled' ? systemResult.value : null,
    teams: teamsResult.status === 'fulfilled' && Array.isArray(teamsResult.value) ? teamsResult.value : [],
    collaborators: collaboratorsResult.status === 'fulfilled' && Array.isArray(collaboratorsResult.value) ? collaboratorsResult.value : [],
    vendors: vendorsResult.status === 'fulfilled' && Array.isArray(vendorsResult.value) ? vendorsResult.value : []
  };
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
      // keep default details
    }
    const suffix = details ? `: ${details}` : '';
    throw new Error(`${method} ${path} failed with status ${response.status}${suffix}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function createSystem(payload: Partial<System>): Promise<System> {
  return requestJson<System>('/api/systems', 'POST', payload);
}

export async function updateSystem(id: string, payload: Partial<System>): Promise<System> {
  return requestJson<System>(`/api/systems/${id}`, 'PATCH', payload);
}

export async function deleteSystem(id: string): Promise<void> {
  await requestJson<void>(`/api/systems/${id}`, 'DELETE');
}
