import type { Initiative } from '../entities/Initiative.js';

export interface InitiativeRepository {
  listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]>;
  findById(id: string): Promise<Initiative | null>;
  save(initiative: Initiative): Promise<Initiative>;
  create(payload: Omit<Initiative, 'id' | 'createdAt'>): Promise<Initiative>;
  delete(id: string): Promise<void>;
}
