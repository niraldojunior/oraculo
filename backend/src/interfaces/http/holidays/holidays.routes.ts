import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';
import { createHolidaysController } from './holidays.controller.js';

interface HolidaysRouterDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
}

export function createHolidaysRouter(deps: HolidaysRouterDeps) {
  const router = Router();
  const controller = createHolidaysController(deps);

  router.get('/api/holidays', controller.getHolidays);
  router.post('/api/holidays', controller.createHoliday);
  router.delete('/api/holidays/:id', controller.deleteHoliday);

  return router;
}
