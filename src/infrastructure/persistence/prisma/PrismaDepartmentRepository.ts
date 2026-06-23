import type { PrismaClient } from '@prisma/client';
import type {
  Department,
  DepartmentMasterUser,
  DepartmentWriteData
} from '../../../domain/entities/Department.js';
import type { DepartmentRepository } from '../../../domain/repositories/DepartmentRepository.js';

export class PrismaDepartmentRepository implements DepartmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listDepartments(): Promise<Department[]> {
    return this.prisma.department.findMany();
  }

  async updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<Department> {
    return this.prisma.department.update({
      where: { id },
      data
    });
  }

  async createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    const { departmentData, masterUser, masterUserId } = params;

    return this.prisma.$transaction(async tx => {
      const newDept = await tx.department.create({
        data: {
          name: departmentData.name ?? '',
          companyId: departmentData.companyId ?? ''
        }
      });

      const companyId = departmentData.companyId ?? newDept.companyId;

      if (masterUserId) {
        await tx.collaborator.update({
          where: { id: masterUserId },
          data: {
            role: 'Master',
            departmentId: newDept.id,
            companyId
          }
        });

        await tx.department.update({
          where: { id: newDept.id },
          data: { masterUserId }
        });
      } else if (masterUser && masterUser.email && masterUser.name) {
        const newMaster = await tx.collaborator.create({
          data: {
            name: masterUser.name,
            email: masterUser.email,
            password: masterUser.password || '123456',
            role: 'Master',
            companyId,
            departmentId: newDept.id,
            isAdmin: false,
            photoUrl: masterUser.photoUrl || ''
          }
        });

        await tx.department.update({
          where: { id: newDept.id },
          data: { masterUserId: newMaster.id }
        });
      }

      const result = await tx.department.findUnique({ where: { id: newDept.id } });
      if (!result) {
        throw new Error('Department not found after creation');
      }
      return result;
    });
  }

  async updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    const { id, departmentData, masterUser, masterUserId } = params;

    return this.prisma.$transaction(async tx => {
      const updatedDept = await tx.department.update({
        where: { id },
        data: {
          ...(departmentData.name !== undefined ? { name: departmentData.name } : {}),
          ...(departmentData.companyId !== undefined ? { companyId: departmentData.companyId } : {}),
          ...(departmentData.masterUserId !== undefined
            ? { masterUserId: departmentData.masterUserId }
            : {})
        }
      });

      if (masterUserId) {
        await tx.collaborator.updateMany({
          where: { departmentId: id, role: 'Master' },
          data: { role: 'Operacional' }
        });

        await tx.collaborator.update({
          where: { id: masterUserId },
          data: {
            role: 'Master',
            departmentId: id,
            companyId: updatedDept.companyId
          }
        });

        await tx.department.update({
          where: { id },
          data: { masterUserId }
        });
      } else if (masterUser && masterUser.email && masterUser.name) {
        await tx.collaborator.updateMany({
          where: { departmentId: id, role: 'Master' },
          data: { role: 'Operacional' }
        });

        const newMaster = await tx.collaborator.create({
          data: {
            name: masterUser.name,
            email: masterUser.email,
            password: masterUser.password || '123456',
            role: 'Master',
            companyId: updatedDept.companyId,
            departmentId: id,
            isAdmin: false,
            photoUrl: masterUser.photoUrl || ''
          }
        });

        await tx.department.update({
          where: { id },
          data: { masterUserId: newMaster.id }
        });
      }

      const result = await tx.department.findUnique({ where: { id } });
      if (!result) {
        throw new Error('Department not found after update');
      }
      return result;
    });
  }
}
