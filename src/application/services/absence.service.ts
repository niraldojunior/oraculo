import { Inject, Injectable } from '@nestjs/common';
import type { Absence, AbsenceWriteData } from '../../domain/entities/Absence.js';
import type { AbsenceRepository } from '../../domain/repositories/AbsenceRepository.js';
import { ABSENCE_REPOSITORY } from '../../domain/repositories/tokens.js';

@Injectable()
export class AbsenceService {
  constructor(
    @Inject(ABSENCE_REPOSITORY)
    private readonly repository: AbsenceRepository
  ) {}

  listAbsences(scope: { companyId?: string; departmentId?: string; teamId?: string }): Promise<Absence[]> {
    return this.repository.listAbsences(scope);
  }

  createAbsence(data: AbsenceWriteData): Promise<Absence> {
    return this.repository.createAbsence(data);
  }

  deleteAbsence(id: string): Promise<void> {
    return this.repository.deleteAbsence(id);
  }
}
