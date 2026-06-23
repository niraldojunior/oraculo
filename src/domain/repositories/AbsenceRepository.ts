import type { Absence, AbsenceWriteData } from '../entities/Absence.js';

export interface AbsenceRepository {
  listAbsences(scope: {
    companyId?: string;
    departmentId?: string;
    teamId?: string;
  }): Promise<Absence[]>;
  createAbsence(data: AbsenceWriteData): Promise<Absence>;
  deleteAbsence(id: string): Promise<void>;
}
