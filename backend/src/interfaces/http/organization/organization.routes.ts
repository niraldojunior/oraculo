import { Router } from 'express';
import type { Response } from 'express';
import { createOrganizationController } from './organization.controller.js';
import type { OrganizationApplicationService } from '../../../application/OrganizationApplicationService.js';

interface OrganizationRouterDeps {
  organizationService: OrganizationApplicationService;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  getCachedState: <T>(key: string) => { value: T; stale: boolean } | null;
  isRefreshing: (key: string) => boolean;
  markRefreshing: (key: string, refreshing: boolean) => void;
  singleflight: <T>(key: string, factory: () => Promise<T>) => Promise<T>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
  invalidateImageCacheByPrefix: (prefix: string) => void;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  getCommonWhere: (req: any) => Record<string, string>;
  sanitizeTeam: (data: Record<string, any>) => Record<string, any>;
  sanitizeCollaborator: (data: Record<string, any>) => Record<string, any>;
  ensureCompanyMatchesDept: (data: any) => Promise<any>;
  optimizeFieldInPlace: (obj: any, field: string, kind: any) => Promise<any>;
  transformCollaboratorImage: <T extends { id: string; photoUrl?: string | null }>(c: T) => T;
  collaboratorSafeSelect: any;
  collaboratorDashboardSelect: any;
}

export function createOrganizationRouter(deps: OrganizationRouterDeps) {
  const router = Router();
  const controller = createOrganizationController(deps);

  router.get('/api/teams', controller.getTeams);
  router.post('/api/teams', controller.createTeam);
  router.patch('/api/teams/:id', controller.updateTeam);
  router.delete('/api/teams/:id', controller.deleteTeam);

  router.get('/api/collaborators', controller.getCollaborators);
  router.get('/api/collaborators/email/:email', controller.getCollaboratorByEmail);
  router.post('/api/collaborators', controller.createCollaborator);
  router.patch('/api/collaborators/:id', controller.updateCollaborator);
  router.delete('/api/collaborators/:id', controller.deleteCollaborator);
  router.post('/api/collaborators/skills/toggle', controller.toggleCollaboratorSkill);

  return router;
}
