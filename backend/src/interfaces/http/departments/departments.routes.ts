import { Router } from 'express';
import type { Response } from 'express';
import type { DepartmentApplicationService } from '../../../application/DepartmentApplicationService.js';
import { createDepartmentsController } from './departments.controller.js';

interface DepartmentsRouterDeps {
  departmentService: DepartmentApplicationService;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
}

export function createDepartmentsRouter(deps: DepartmentsRouterDeps) {
  const router = Router();
  const controller = createDepartmentsController(deps);

  router.get('/api/departments', controller.getDepartments);
  router.patch('/api/departments/:id', controller.patchDepartmentBasic);
  router.post('/api/departments', controller.createDepartment);
  router.patch('/api/departments/:id', controller.patchDepartmentWithMaster);

  return router;
}
