import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';
import { createAbsencesController } from './absences.controller.js';

interface AbsencesRouterDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
}

export function createAbsencesRouter(deps: AbsencesRouterDeps) {
  const router = Router();
  const controller = createAbsencesController(deps);

  router.get('/api/absences', controller.getAbsences);
  router.post('/api/absences', controller.createAbsence);
  router.delete('/api/absences/:id', controller.deleteAbsence);

  return router;
}
