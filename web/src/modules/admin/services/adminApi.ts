import { getJson } from '@/shared/http/apiClient';
import type { Collaborator, Company, Department } from '@/types';

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

export async function fetchAdminData(): Promise<{
  companies: Company[];
  departments: Department[];
  collaborators: Collaborator[];
}> {
  const [companies, departments, collaborators] = await Promise.all([
    getJson<Company[]>('/api/companies'),
    getJson<Department[]>('/api/departments'),
    getJson<Collaborator[]>('/api/collaborators')
  ]);

  return {
    companies: Array.isArray(companies) ? companies : [],
    departments: Array.isArray(departments) ? departments : [],
    collaborators: Array.isArray(collaborators) ? collaborators : []
  };
}

export async function saveCompany(company: Partial<Company>): Promise<Company> {
  const isUpdate = Boolean(company.id);
  const payload = {
    fantasyName: company.fantasyName,
    realName: company.realName || company.fantasyName,
    logo: company.logo || '',
    description: company.description || ''
  };
  return requestJson<Company>(isUpdate ? `/api/companies/${company.id}` : '/api/companies', isUpdate ? 'PATCH' : 'POST', payload);
}

export async function saveDepartment(department: Partial<Department> & {
  masterUserId?: string;
  masterUser?: {
    name: string;
    email: string;
    password?: string;
    photoUrl?: string;
  };
}): Promise<Department> {
  const isUpdate = Boolean(department.id);
  const { id: _discarded, ...payload } = department;
  return requestJson<Department>(isUpdate ? `/api/departments/${department.id}` : '/api/departments', isUpdate ? 'PATCH' : 'POST', payload);
}

export async function deleteCompany(id: string): Promise<void> {
  await requestJson<void>(`/api/companies/${id}`, 'DELETE');
}

export async function deleteDepartment(id: string): Promise<void> {
  await requestJson<void>(`/api/departments/${id}`, 'DELETE');
}
