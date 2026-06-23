import type {
  Department,
  DepartmentMasterUser,
  DepartmentWriteData
} from '../entities/Department.js';

export interface DepartmentRepository {
  listDepartments(): Promise<Department[]>;
  updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<Department>;
  createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department>;
  updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department>;
}
