import type { Holiday, HolidayWriteData } from '../entities/Holiday.js';

export interface HolidayRepository {
  listHolidays(companyId?: string): Promise<Holiday[]>;
  createHoliday(data: HolidayWriteData): Promise<Holiday>;
  deleteHoliday(id: string): Promise<void>;
}
