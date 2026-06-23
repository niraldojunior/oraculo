import { describe, expect, it, jest } from '@jest/globals';
import { HolidayService } from '../application/services/holiday.service.js';
import type { HolidayRepository } from '../domain/repositories/HolidayRepository.js';
import type { HolidayWriteData } from '../domain/entities/Holiday.js';

describe('HolidayService', () => {
  it('delegates list/create/delete to repository', async () => {
    const repository: HolidayRepository = {
      listHolidays: jest.fn(async () => []),
      createHoliday: jest.fn(async (data: HolidayWriteData) => ({
        id: 'h1',
        date: data.date ?? '2026-12-25',
        name: data.name ?? 'Natal',
        companyId: data.companyId ?? null
      })),
      deleteHoliday: jest.fn(async () => undefined)
    };

    const service = new HolidayService(repository);

    await service.listHolidays('c1');
    await service.createHoliday({ date: '2026-12-25', name: 'Natal', companyId: 'c1' });
    await service.deleteHoliday('h1');

    expect(repository.listHolidays).toHaveBeenCalledWith('c1');
    expect(repository.createHoliday).toHaveBeenCalled();
    expect(repository.deleteHoliday).toHaveBeenCalledWith('h1');
  });
});
