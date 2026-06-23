import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  Department,
  DepartmentMasterUser,
  DepartmentWriteData
} from '../../../domain/entities/Department.js';
import type { DepartmentRepository } from '../../../domain/repositories/DepartmentRepository.js';

@Injectable()
export class InMemoryDepartmentRepository implements DepartmentRepository {
  private readonly departments = new Map<string, Department>();

  async listDepartments(): Promise<Department[]> {
    return [...this.departments.values()];
  }

  async updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<Department> {
    const current = this.departments.get(id);
    if (!current) {
      throw new Error('Department not found');
    }

    const updated: Department = { ...current, ...data };
    this.departments.set(id, updated);
    return updated;
  }

  async createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    const created: Department = {
      id: randomUUID(),
      name: params.departmentData.name ?? '',
      companyId: params.departmentData.companyId ?? '',
      masterUserId: params.masterUserId ?? null
    };
    this.departments.set(created.id, created);
    return created;
  }

  async updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    const current = this.departments.get(params.id);
    if (!current) {
      throw new Error('Department not found');
    }

    const updated: Department = {
      ...current,
      ...params.departmentData,
      masterUserId: params.masterUserId ?? current.masterUserId
    };
    this.departments.set(params.id, updated);
    return updated;
  }
}
