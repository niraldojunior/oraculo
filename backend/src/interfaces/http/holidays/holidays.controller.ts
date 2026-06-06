import type { PrismaClient } from '@prisma/client';

interface HolidaysControllerDeps {
  prisma: PrismaClient;
}

export function createHolidaysController(deps: HolidaysControllerDeps) {
  const { prisma } = deps;

  const getHolidays = async (req: any, res: any) => {
    const { companyId } = req.query;
    try {
      const holidays = await prisma.holiday.findMany({
        where: {
          OR: [
            { companyId: companyId as string },
            { companyId: null }
          ]
        }
      });
      res.json(holidays);
    } catch (error) {
      console.error('API Error /api/holidays [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  };

  const createHoliday = async (req: any, res: any) => {
    try {
      const holiday = await prisma.holiday.create({
        data: req.body
      });
      res.json(holiday);
    } catch (error) {
      console.error('API Error /api/holidays [POST]:', error);
      res.status(500).json({ error: 'Failed to create holiday' });
    }
  };

  const deleteHoliday = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await prisma.holiday.delete({ where: { id } });
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
