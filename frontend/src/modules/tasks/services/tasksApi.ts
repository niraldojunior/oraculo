import { fetchInitiativesPageData, updateInitiative } from '../../initiatives/services/initiativesApi';
import type { Collaborator, Initiative, System } from '../../../types';

export interface TasksScope {
  companyId: string;
  departmentId?: string;
}

export async function fetchTasksPageData(scope: TasksScope): Promise<{
  initiatives: Initiative[];
  collaborators: Collaborator[];
  systems: System[];
}> {
  const data = await fetchInitiativesPageData(scope);
  return {
    initiatives: data.initiatives,
    collaborators: data.collaborators,
    systems: data.systems
  };
}

export async function persistTaskInitiative(initiative: Initiative): Promise<void> {
  await updateInitiative(initiative.id, initiative);
}
