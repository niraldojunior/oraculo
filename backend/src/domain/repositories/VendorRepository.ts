import type { Collaborator } from '../models/Collaborator.js';
import type { Company } from '../models/Company.js';
import type { Contract } from '../models/Contract.js';
import type { Department } from '../models/Department.js';
import type { System } from '../models/System.js';
import type { Vendor, VendorWriteData } from '../models/Vendor.js';

export type { VendorWriteData };

export interface VendorRepository {
  listVendors(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    vendorLiteSelect: unknown;
    vendorListOmit: unknown;
  }): Promise<Vendor[]>;
  getVendorsContext(params: {
    scope: { companyId?: string; departmentId?: string };
    collaboratorSafeSelect: unknown;
    vendorListOmit: unknown;
    systemListOmit: unknown;
    companyListOmit: unknown;
  }): Promise<{
    vendors: Vendor[];
    contracts: Contract[];
    systems: System[];
    collaborators: Collaborator[];
    companies: Company[];
    departments: Department[];
  }>;
  createVendor(data: VendorWriteData): Promise<Vendor>;
  updateVendor(id: string, data: VendorWriteData): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;
}