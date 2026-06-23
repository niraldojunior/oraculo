import type { Contract } from './Contract.js';
import type { Company } from './Company.js';
import type { Department } from './Department.js';

export interface Vendor {
  id: string;
  companyId: string;
  departmentId: string;
  companyName: string;
  taxId: string;
  type: string;
  logoUrl?: string | null;
  directorId?: string | null;
  managerId?: string | null;
}

export interface VendorContext {
  vendors: Vendor[];
  contracts: Contract[];
  systems: unknown[];
  collaborators: unknown[];
  companies: Company[];
  departments: Department[];
}

export type VendorWriteData = Partial<Omit<Vendor, 'id'>>;
