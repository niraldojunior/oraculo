import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createHolidaysController } from './holidays.controller.js';

interface HolidaysRouterDeps {
  prisma: PrismaClient;
}

export function createHolidaysRouter(deps: HolidaysRouterDeps) {
  const router = Router();
  const controller = createHolidaysController(deps);

  router.get('/api/holidays', controller.getHolidays);
  router.post('/api/holidays', controller.createHoliday);
  router.delete('/api/holidays/:id', controller.deleteHoliday);

  return router;
}
