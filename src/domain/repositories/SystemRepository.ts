import type { System, SystemWriteData } from '../entities/System.js';

export interface SystemRepository {
  listSystems(scope: { companyId?: string; departmentId?: string }): Promise<System[]>;
  findSystemById(id: string): Promise<System | null>;
  createSystem(data: SystemWriteData): Promise<System>;
  updateSystem(id: string, data: SystemWriteData): Promise<System>;
  deleteSystem(id: string): Promise<void>;
}
