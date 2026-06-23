import type { Vendor, VendorContext, VendorWriteData } from '../entities/Vendor.js';

export interface VendorRepository {
  listVendors(scope: { companyId?: string; departmentId?: string }): Promise<Vendor[]>;
  getVendorsContext(scope: { companyId?: string; departmentId?: string }): Promise<VendorContext>;
  createVendor(data: VendorWriteData): Promise<Vendor>;
  updateVendor(id: string, data: VendorWriteData): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;
}
