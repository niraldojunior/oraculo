import type { PrismaClient } from '@prisma/client';
import type { Absence, AbsenceWriteData } from '../../../domain/entities/Absence.js';
import type { AbsenceRepository } from '../../../domain/repositories/AbsenceRepository.js';

export class PrismaAbsenceRepository implements AbsenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listAbsences(scope: {
    companyId?: string;
    departmentId?: string;
    teamId?: string;
  }): Promise<Absence[]> {
    const absences = await this.prisma.absence.findMany({
      where: {
        collaborator: {
          ...(scope.companyId ? { companyId: scope.companyId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
          ...(scope.teamId ? { squadId: scope.teamId } : {})
        }
      },
      include: {
        collaborator: {
          select: {
            id: true,
            companyId: true,
            departmentId: true,
            squadId: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return absences as unknown as Absence[];
  }

  async createAbsence(data: AbsenceWriteData): Promise<Absence> {
    const created = await this.prisma.absence.create({
      data: {
        collaboratorId: data.collaboratorId ?? '',
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        type: data.type ?? '',
        reason: data.reason ?? null
      },
      include: {
        collaborator: {
          select: {
            id: true,
            companyId: true,
            departmentId: true,
            squadId: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return created as unknown as Absence;
  }

  async deleteAbsence(id: string): Promise<void> {
    await this.prisma.absence.delete({ where: { id } });
  }
}
