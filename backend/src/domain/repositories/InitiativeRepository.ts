import type { Initiative } from '../models/Initiative.js';

export interface InitiativeRepository {
  findById(id: string): Promise<Initiative | null>;
  listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]>;
  save(initiative: Initiative): Promise<Initiative>;
  deleteById(id: string): Promise<void>;
}
