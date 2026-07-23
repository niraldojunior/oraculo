import { getJson, postJson, patchJson, deleteJson } from '@/shared/http/apiClient';
import type { Collaborator, Initiative, System, Team } from '@/types';

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

export async function createInitiativeComment(
  initiativeId: string,
  payload: { content: string; userId: string; userName: string }
): Promise<any> {
  return postJson<any>(`/api/initiatives/${initiativeId}/comments`, payload);
}

export async function updateInitiativeComment(
  initiativeId: string,
  commentId: string,
  payload: { content: string }
): Promise<any> {
  return patchJson<any>(`/api/initiatives/${initiativeId}/comments/${commentId}`, payload);
}

export async function deleteInitiativeComment(
  initiativeId: string,
  commentId: string
): Promise<void> {
  await deleteJson<void>(`/api/initiatives/${initiativeId}/comments/${commentId}`);
}

export async function createInitiative(payload: Partial<Initiative> & { updatedBy?: string }): Promise<Initiative> {
  return postJson<Initiative>('/api/initiatives', payload);
}

export async function updateInitiative(id: string, payload: Partial<Initiative> & { updatedBy?: string }): Promise<Initiative> {
  return patchJson<Initiative>(`/api/initiatives/${id}`, payload);
}

export async function deleteInitiative(id: string): Promise<void> {
  await deleteJson<void>(`/api/initiatives/${id}`);
}

export async function deleteInitiatives(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => deleteInitiative(id)));
}

export async function updateInitiativePriority(id: string, priority: number): Promise<Initiative> {
  return patchJson<Initiative>(`/api/initiatives/${id}`, { priority });
}

export async function updateMilestone(
  initiativeId: string,
  milestoneId: string,
  payload: Partial<{ name: string; systemId: string; baselineDate: string; realDate: string; description: string; assignedEngineerId: string; startDate: string; order: number }>
): Promise<any> {
  return patchJson<any>(`/api/initiatives/${initiativeId}/milestones/${milestoneId}`, payload);
}

export async function createMilestone(
  initiativeId: string,
  payload: Partial<{ name: string; systemId: string; baselineDate: string; realDate: string; description: string; assignedEngineerId: string; startDate: string; order: number }>
): Promise<any> {
  return postJson<any>(`/api/initiatives/${initiativeId}/milestones`, payload);
}

export async function deleteMilestone(
  initiativeId: string,
  milestoneId: string
): Promise<void> {
  await deleteJson<void>(`/api/initiatives/${initiativeId}/milestones/${milestoneId}`);
}
