import { Inject, Injectable } from '@nestjs/common';
import type { Holiday, HolidayWriteData } from '../../domain/entities/Holiday.js';
import type { HolidayRepository } from '../../domain/repositories/HolidayRepository.js';
import { HOLIDAY_REPOSITORY } from '../../domain/repositories/tokens.js';

@Injectable()
export class HolidayService {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly repository: HolidayRepository
  ) {}

  listHolidays(companyId?: string): Promise<Holiday[]> {
    return this.repository.listHolidays(companyId);
  }

  createHoliday(data: HolidayWriteData): Promise<Holiday> {
    return this.repository.createHoliday(data);
  }

  deleteHoliday(id: string): Promise<void> {
    return this.repository.deleteHoliday(id);
  }
}
