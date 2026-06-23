import { randomUUID } from 'node:crypto';
import type { Holiday, HolidayWriteData } from '../../../domain/entities/Holiday.js';
import type { HolidayRepository } from '../../../domain/repositories/HolidayRepository.js';
import type { OracleService } from './oracle.service.js';

type Row = Record<string, unknown>;

export class OracleHolidayRepository implements HolidayRepository {
  constructor(private readonly oracle: OracleService) {}

  async listHolidays(companyId?: string): Promise<Holiday[]> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT "id", "date", "name", "companyId"
        FROM "Holiday"
        WHERE (
          :companyId IS NOT NULL AND ("companyId" = :companyId OR "companyId" IS NULL)
        )
        OR (
          :companyId IS NULL AND "companyId" IS NULL
        )
      `,
      { companyId: companyId ?? null }
    );

    return rows.map(row => ({
      id: String(row.id),
      date: String(row.date ?? ''),
      name: String(row.name ?? ''),
      companyId: row.companyId == null ? null : String(row.companyId)
    }));
  }

  async createHoliday(data: HolidayWriteData): Promise<Holiday> {
    const id = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "Holiday" (
          "id", "date", "name", "companyId"
        ) VALUES (
          :id, :date, :name, :companyId
        )
      `,
      {
        id,
        date: data.date,
        name: data.name,
        companyId: data.companyId ?? null
      }
    );

    const rows = await this.oracle.query<Row>(
      'SELECT "id", "date", "name", "companyId" FROM "Holiday" WHERE "id" = :id',
      { id }
    );

    const row = rows[0];
    if (!row) throw new Error('Holiday not found after creation');

    return {
      id: String(row.id),
      date: String(row.date ?? ''),
      name: String(row.name ?? ''),
      companyId: row.companyId == null ? null : String(row.companyId)
    };
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Holiday" WHERE "id" = :id', { id });
  }
}
