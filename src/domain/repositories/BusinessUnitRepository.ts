import type { BusinessUnit, BusinessUnitWriteData } from '../entities/BusinessUnit.js';

export interface BusinessUnitRepository {
  listBusinessUnits(scope: { companyId?: string; departmentId?: string }): Promise<BusinessUnit[]>;
  createBusinessUnit(data: BusinessUnitWriteData): Promise<BusinessUnit>;
  updateBusinessUnit(id: string, data: BusinessUnitWriteData): Promise<BusinessUnit>;
  deleteBusinessUnit(id: string): Promise<void>;
}
