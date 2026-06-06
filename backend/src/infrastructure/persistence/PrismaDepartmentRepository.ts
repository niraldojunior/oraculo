import type { PrismaClient } from '@prisma/client';
import type { DepartmentRepository, DepartmentWriteData } from '../../domain/repositories/DepartmentRepository.js';

export class PrismaDepartmentRepository implements DepartmentRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listDepartments(): Promise<any[]> {
    return this.prisma.department.findMany();
  }

  async updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<any> {
    return this.prisma.department.update({
      where: { id },
      data: data as any
    });
  }

  async createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: any;
    masterUserId?: string;
  }): Promise<any> {
    const { departmentData, masterUser, masterUserId } = params;

    return this.prisma.$transaction(async (tx) => {
      const newDept = await tx.department.create({
        data: departmentData as any
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
      } else if (masterUser && masterUser.email && masterUser.name) {
        await tx.collaborator.create({
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
      }

      return newDept;
    });
  }

  async updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: any;
    masterUserId?: string;
  }): Promise<any> {
    const { id, departmentData, masterUser, masterUserId } = params;

    return this.prisma.$transaction(async (tx) => {
      const updateData = departmentData;
      const updatedDept = await tx.department.update({
        where: { id },
        data: updateData as any
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

      return updatedDept;
    });
  }
}