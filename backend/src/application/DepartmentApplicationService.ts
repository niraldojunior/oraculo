import type { DepartmentRepository, DepartmentWriteData } from '../domain/repositories/DepartmentRepository.js';

export class DepartmentApplicationService {
  private readonly repository: DepartmentRepository;

  constructor(repository: DepartmentRepository) {
    this.repository = repository;
  }

  async listDepartments() {
    return this.repository.listDepartments();
  }

  async updateDepartmentBasic(id: string, data: DepartmentWriteData) {
    return this.repository.updateDepartmentBasic(id, data);
  }

  async createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: any;
    masterUserId?: string;
  }) {
    return this.repository.createDepartmentWithMaster(params);
  }

  async updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: any;
    masterUserId?: string;
  }) {
    return this.repository.updateDepartmentWithMaster(params);
  }
}