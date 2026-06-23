import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Holiday, HolidayWriteData } from '../../../domain/entities/Holiday.js';
import type { HolidayRepository } from '../../../domain/repositories/HolidayRepository.js';

@Injectable()
export class InMemoryHolidayRepository implements HolidayRepository {
  private readonly holidays = new Map<string, Holiday>();

  async listHolidays(companyId?: string): Promise<Holiday[]> {
    return [...this.holidays.values()].filter(item => {
      if (!companyId) {
        return item.companyId == null;
      }
      return item.companyId === companyId || item.companyId == null;
    });
  }

  async createHoliday(data: HolidayWriteData): Promise<Holiday> {
    const created: Holiday = {
      id: randomUUID(),
      date: data.date ?? '',
      name: data.name ?? '',
      companyId: data.companyId ?? null
    };

    this.holidays.set(created.id, created);
    return created;
  }

  async deleteHoliday(id: string): Promise<void> {
    this.holidays.delete(id);
  }
}
