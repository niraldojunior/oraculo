import { describe, expect, it, jest } from '@jest/globals';
import { AbsenceService } from '../../../application/services/absence.service.js';
import type { AbsenceRepository } from '../../../domain/repositories/AbsenceRepository.js';
import type { AbsenceWriteData } from '../../../domain/entities/Absence.js';

describe('AbsenceService', () => {
  it('delegates list/create/delete to repository', async () => {
    const repository: AbsenceRepository = {
      listAbsences: jest.fn(async () => []),
      createAbsence: jest.fn(async (data: AbsenceWriteData) => ({
        id: 'a1',
        collaboratorId: data.collaboratorId ?? 'c1',
        startDate: data.startDate ?? '2026-01-01',
        endDate: data.endDate ?? '2026-01-02',
        type: data.type ?? 'Ferias',
        reason: data.reason ?? null
      })),
      deleteAbsence: jest.fn(async () => undefined)
    };

    const service = new AbsenceService(repository);

    await service.listAbsences({ companyId: 'co1', departmentId: 'd1', teamId: 't1' });
    await service.createAbsence({
      collaboratorId: 'c1',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      type: 'Ferias'
    });
    await service.deleteAbsence('a1');

    expect(repository.listAbsences).toHaveBeenCalledWith({ companyId: 'co1', departmentId: 'd1', teamId: 't1' });
    expect(repository.createAbsence).toHaveBeenCalled();
    expect(repository.deleteAbsence).toHaveBeenCalledWith('a1');
  });
});

