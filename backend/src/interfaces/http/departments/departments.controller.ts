import type { Response } from 'express';
import type { DepartmentApplicationService } from '../../../application/DepartmentApplicationService.js';

interface DepartmentsControllerDeps {
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

export function createDepartmentsController(deps: DepartmentsControllerDeps) {
  const {
    departmentService,
    buildCacheKey,
    serveSWR,
    setCached,
    invalidateCacheByPrefix
  } = deps;

  const getDepartments = async (_req: any, res: any) => {
    try {
      const cacheKey = buildCacheKey('departments');
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        const departments = await departmentService.listDepartments();
        console.log('Found', departments.length, 'departments', `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, departments);
        return departments;
      }, 'departments');
    } catch (error) {
      console.error('API Error /api/departments [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  };

  // Kept to preserve current route behavior and order from expressApp.
  const patchDepartmentBasic = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const department = await departmentService.updateDepartmentBasic(id, req.body);
      res.json(department);
    } catch (error) {
      console.error('API Error /api/departments/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update department' });
    }
  };

  const createDepartment = async (req: any, res: any) => {
    const { masterUser, masterUserId, ...deptData } = req.body;
    try {
      const department = await departmentService.createDepartmentWithMaster({
        departmentData: deptData,
        masterUser,
        masterUserId
      });
      invalidateCacheByPrefix('departments');
      invalidateCacheByPrefix('collaborators');
      invalidateCacheByPrefix('teams');
      res.json(department);
    } catch (error: any) {
      console.error('API Error /api/departments [POST]:', error);
      res.status(500).json({ error: 'Failed to create department', details: error.message });
    }
  };

  const patchDepartmentWithMaster = async (req: any, res: any) => {
    const { id } = req.params;
    const { masterUser, masterUserId, ...deptData } = req.body;
    try {
      const department = await departmentService.updateDepartmentWithMaster({
        id,
        departmentData: deptData,
        masterUser,
        masterUserId
      });
      invalidateCacheByPrefix('departments');
      invalidateCacheByPrefix('collaborators');
      invalidateCacheByPrefix('teams');
      res.json(department);
    } catch (error: any) {
      console.error('API Error /api/departments/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update department', details: error.message });
    }
  };

  return {
    getDepartments,
    patchDepartmentBasic,
    createDepartment,
    patchDepartmentWithMaster
  };
}
