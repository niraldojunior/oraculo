import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';

interface HolidaysControllerDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
}

export function createHolidaysController(deps: HolidaysControllerDeps) {
  const { prisma, oracle, provider } = deps;

  const getHolidays = async (req: any, res: any) => {
    const { companyId } = req.query;
    try {
      if (prisma) {
        const holidays = await prisma.holiday.findMany({
          where: {
            OR: [
              { companyId: companyId as string },
              { companyId: null }
            ]
          }
        });
        return res.json(holidays);
      }

      if (!oracle) {
        return res.status(501).json({ error: `Holidays are not implemented for DB_PROVIDER=${provider}` });
      }

      const holidays = await oracle.query<Record<string, unknown>>(
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
      res.json(holidays);
    } catch (error) {
      console.error('API Error /api/holidays [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  };

  const createHoliday = async (req: any, res: any) => {
    try {
      if (prisma) {
        const holiday = await prisma.holiday.create({
          data: req.body
        });
        return res.json(holiday);
      }

      if (!oracle) {
        return res.status(501).json({ error: `Holidays are not implemented for DB_PROVIDER=${provider}` });
      }

      const id = randomUUID();
      await oracle.execute(
        `
          INSERT INTO "Holiday" (
            "id", "date", "name", "companyId"
          ) VALUES (
            :id, :date, :name, :companyId
          )
        `,
        {
          id,
          date: req.body?.date,
          name: req.body?.name,
          companyId: req.body?.companyId ?? null
        }
      );

      const createdRows = await oracle.query<Record<string, unknown>>(
        'SELECT "id", "date", "name", "companyId" FROM "Holiday" WHERE "id" = :id',
        { id }
      );

      const holiday = createdRows[0] || null;
      res.json(holiday);
    } catch (error) {
      console.error('API Error /api/holidays [POST]:', error);
      res.status(500).json({ error: 'Failed to create holiday' });
    }
  };

  const deleteHoliday = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      if (prisma) {
        await prisma.holiday.delete({ where: { id } });
        return res.json({ message: 'Holiday deleted' });
      }

      if (!oracle) {
        return res.status(501).json({ error: `Holidays are not implemented for DB_PROVIDER=${provider}` });
      }

      await oracle.execute('DELETE FROM "Holiday" WHERE "id" = :id', { id });
      res.json({ message: 'Holiday deleted' });
    } catch (error) {
      console.error('API Error /api/holidays/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete holiday' });
    }
  };

  return {
    getHolidays,
    createHoliday,
    deleteHoliday
  };
}
