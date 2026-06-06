import type { Department, DepartmentWriteData } from '../models/Department.js';

export type { DepartmentWriteData };

export interface DepartmentRepository {
  listDepartments(): Promise<Department[]>;
  updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<Department>;
  createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: unknown;
    masterUserId?: string;
  }): Promise<Department>;
  updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: unknown;
    masterUserId?: string;
  }): Promise<Department>;
}