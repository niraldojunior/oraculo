import { describe, expect, it, jest } from '@jest/globals';
import { DepartmentService } from '../application/services/department.service.js';
import type { DepartmentRepository } from '../domain/repositories/DepartmentRepository.js';
import type { DepartmentWriteData, DepartmentMasterUser } from '../domain/entities/Department.js';

describe('DepartmentService', () => {
  it('delegates createDepartmentWithMaster with masterUserId', async () => {
    const repository: DepartmentRepository = {
      listDepartments: jest.fn(async () => []),
      updateDepartmentBasic: jest.fn(async (id: string, data: DepartmentWriteData) => ({
        id,
        name: data.name ?? '',
        companyId: data.companyId ?? '',
        masterUserId: data.masterUserId ?? null
      })),
      createDepartmentWithMaster: jest.fn(async (params: {
        departmentData: DepartmentWriteData;
        masterUser?: DepartmentMasterUser;
        masterUserId?: string;
      }) => ({
        id: 'd1',
        name: params.departmentData.name ?? '',
        companyId: params.departmentData.companyId ?? '',
        masterUserId: params.masterUserId ?? null
      })),
      updateDepartmentWithMaster: jest.fn(async (params: {
        id: string;
        departmentData: DepartmentWriteData;
        masterUser?: DepartmentMasterUser;
        masterUserId?: string;
      }) => ({
        id: params.id,
        name: params.departmentData.name ?? '',
        companyId: params.departmentData.companyId ?? '',
        masterUserId: params.masterUserId ?? null
      }))
    };

    const service = new DepartmentService(repository);
    await service.createDepartmentWithMaster({
      departmentData: { name: 'Engenharia', companyId: 'c1' },
      masterUserId: 'u1'
    });

    expect(repository.createDepartmentWithMaster).toHaveBeenCalledWith({
      departmentData: { name: 'Engenharia', companyId: 'c1' },
      masterUserId: 'u1'
    });
  });
});
