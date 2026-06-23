import { Inject, Injectable } from '@nestjs/common';
import type {
  Department,
  DepartmentMasterUser,
  DepartmentWriteData
} from '../../domain/entities/Department.js';
import { DEPARTMENT_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { DepartmentRepository } from '../../domain/repositories/DepartmentRepository.js';

@Injectable()
export class DepartmentService {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly repository: DepartmentRepository
  ) {}

  listDepartments(): Promise<Department[]> {
    return this.repository.listDepartments();
  }

  updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<Department> {
    return this.repository.updateDepartmentBasic(id, data);
  }

  createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    return this.repository.createDepartmentWithMaster(params);
  }

  updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    return this.repository.updateDepartmentWithMaster(params);
  }
}
