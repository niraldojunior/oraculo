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

export type VendorWriteData = Partial<Omit<Vendor, 'id'>>;