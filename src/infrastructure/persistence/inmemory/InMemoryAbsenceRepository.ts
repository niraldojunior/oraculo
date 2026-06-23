import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Absence, AbsenceWriteData } from '../../../domain/entities/Absence.js';
import type { AbsenceRepository } from '../../../domain/repositories/AbsenceRepository.js';

@Injectable()
export class InMemoryAbsenceRepository implements AbsenceRepository {
  private readonly absences = new Map<string, Absence>();

  async listAbsences(_scope: {
    companyId?: string;
    departmentId?: string;
    teamId?: string;
  }): Promise<Absence[]> {
    return [...this.absences.values()];
  }

  async createAbsence(data: AbsenceWriteData): Promise<Absence> {
    const created: Absence = {
      id: randomUUID(),
      collaboratorId: data.collaboratorId ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      type: data.type ?? '',
      reason: data.reason ?? null,
      collaborator: data.collaborator
    };

    this.absences.set(created.id, created);
    return created;
  }

  async deleteAbsence(id: string): Promise<void> {
    this.absences.delete(id);
  }
}
