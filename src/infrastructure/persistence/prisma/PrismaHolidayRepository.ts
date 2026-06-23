import type { PrismaClient } from '@prisma/client';
import type { Holiday, HolidayWriteData } from '../../../domain/entities/Holiday.js';
import type { HolidayRepository } from '../../../domain/repositories/HolidayRepository.js';

export class PrismaHolidayRepository implements HolidayRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listHolidays(companyId?: string): Promise<Holiday[]> {
    return (await this.prisma.holiday.findMany({
      where: {
        OR: companyId
          ? [{ companyId }, { companyId: null }]
          : [{ companyId: null }]
      }
    })) as unknown as Holiday[];
  }

  async createHoliday(data: HolidayWriteData): Promise<Holiday> {
    return (await this.prisma.holiday.create({
      data: {
        date: data.date ?? '',
        name: data.name ?? '',
        companyId: data.companyId ?? null
      }
    })) as unknown as Holiday;
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.prisma.holiday.delete({ where: { id } });
  }
}
