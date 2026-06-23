import type { PrismaClient } from '@prisma/client';
import type { System, SystemWriteData } from '../../../domain/entities/System.js';
import type { SystemRepository } from '../../../domain/repositories/SystemRepository.js';

export class PrismaSystemRepository implements SystemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listSystems(scope: { companyId?: string; departmentId?: string }): Promise<System[]> {
    return this.prisma.system.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      }
    }) as unknown as System[];
  }

  async findSystemById(id: string): Promise<System | null> {
    return (await this.prisma.system.findUnique({ where: { id } })) as unknown as System | null;
  }

  async createSystem(data: SystemWriteData): Promise<System> {
    return (await this.prisma.system.create({
      data: {
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        name: data.name ?? '',
        category: data.category ?? null,
        criticality: data.criticality ?? 'Tier 3',
        ownerTeamId: data.ownerTeamId ?? null,
        lifecycleStatus: data.lifecycleStatus ?? 'Planejado',
        debtScore: data.debtScore ?? 0,
        description: data.description ?? '',
        environments: data.environments ?? undefined,
        contextFiles: data.contextFiles ?? undefined,
        technicalSkills: data.technicalSkills ?? undefined,
        responsibleCollaborators: data.responsibleCollaborators ?? undefined
      }
    })) as unknown as System;
  }

  async updateSystem(id: string, data: SystemWriteData): Promise<System> {
    return (await this.prisma.system.update({
      where: { id },
      data: {
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.criticality !== undefined ? { criticality: data.criticality } : {}),
        ...(data.ownerTeamId !== undefined ? { ownerTeamId: data.ownerTeamId } : {}),
        ...(data.lifecycleStatus !== undefined ? { lifecycleStatus: data.lifecycleStatus } : {}),
        ...(data.debtScore !== undefined ? { debtScore: data.debtScore } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.environments !== undefined ? { environments: data.environments } : {}),
        ...(data.contextFiles !== undefined ? { contextFiles: data.contextFiles } : {}),
        ...(data.technicalSkills !== undefined ? { technicalSkills: data.technicalSkills } : {}),
        ...(data.responsibleCollaborators !== undefined
          ? { responsibleCollaborators: data.responsibleCollaborators }
          : {})
      } as any
    })) as unknown as System;
  }

  async deleteSystem(id: string): Promise<void> {
    await this.prisma.system.delete({ where: { id } });
  }
}
