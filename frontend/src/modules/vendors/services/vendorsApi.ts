import { getJson } from '@/shared/http/apiClient';
import type { Collaborator, Company, Contract, Department, System, Vendor } from '@/types';

export interface VendorsScope {
  companyId?: string;
  departmentId?: string;
}

export interface VendorsPageData {
  vendors: Vendor[];
  contracts: Contract[];
  systems: System[];
  companies: Company[];
  departments: Department[];
  collaborators: Collaborator[];
}

function withQuery(scope: VendorsScope, lite = false) {
  const params = new URLSearchParams();
  if (scope.companyId) params.set('companyId', scope.companyId);
  if (scope.departmentId) params.set('departmentId', scope.departmentId);
  if (lite) params.set('lite', 'true');
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
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

export async function fetchVendorsPageData(scope: VendorsScope): Promise<VendorsPageData> {
  const query = withQuery(scope);
  const deptQuery = scope.companyId ? `?companyId=${encodeURIComponent(scope.companyId)}` : '';

  try {
    const ctxData = await getJson<{
      vendors: Vendor[];
      contracts: Contract[];
      systems: System[];
      companies: Company[];
      departments: Department[];
      collaborators: Collaborator[];
    }>(`/api/vendors-context${query}`);

    return {
      vendors: Array.isArray(ctxData.vendors) ? ctxData.vendors : [],
      contracts: Array.isArray(ctxData.contracts) ? ctxData.contracts : [],
      systems: Array.isArray(ctxData.systems) ? ctxData.systems : [],
      companies: Array.isArray(ctxData.companies) ? ctxData.companies : [],
      departments: Array.isArray(ctxData.departments) ? ctxData.departments : [],
      collaborators: Array.isArray(ctxData.collaborators) ? ctxData.collaborators : []
    };
  } catch (error) {
    const [vendors, contracts, systems, departments, collaborators] = await Promise.all([
      getJson<Vendor[]>(`/api/vendors${query}`),
      getJson<Contract[]>(`/api/contracts${query}`),
      getJson<System[]>(`/api/systems${query}`),
      getJson<Department[]>(`/api/departments${deptQuery}`),
      getJson<Collaborator[]>(`/api/collaborators${query}`)
    ]);

    return {
      vendors: Array.isArray(vendors) ? vendors : [],
      contracts: Array.isArray(contracts) ? contracts : [],
      systems: Array.isArray(systems) ? systems : [],
      companies: scope.companyId ? [{ id: scope.companyId, fantasyName: '', realName: '' } as Company] : [],
      departments: Array.isArray(departments) ? departments : [],
      collaborators: Array.isArray(collaborators) ? collaborators : []
    };
  }
}

export async function saveVendor(vendor: Partial<Vendor>): Promise<Vendor> {
  const isUpdate = Boolean(vendor.id);
  const payload = {
    companyId: vendor.companyId,
    departmentId: vendor.departmentId,
    companyName: vendor.companyName,
    taxId: vendor.taxId,
    type: vendor.type,
    logoUrl: vendor.logoUrl,
    directorId: vendor.directorId,
    managerId: vendor.managerId
  };
  return requestJson<Vendor>(isUpdate ? `/api/vendors/${vendor.id}` : '/api/vendors', isUpdate ? 'PATCH' : 'POST', payload);
}

export async function deleteVendor(id: string): Promise<void> {
  await requestJson<void>(`/api/vendors/${id}`, 'DELETE');
}

export async function createVendorContract(payload: {
  companyId: string;
  departmentId: string;
  vendorId: string;
  number: string;
  startDate: string;
  endDate: string;
  model: string;
  annualCost: number;
}): Promise<Contract> {
  return requestJson<Contract>('/api/contracts', 'POST', payload);
}
