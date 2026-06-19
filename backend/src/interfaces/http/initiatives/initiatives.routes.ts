import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import { createInitiativesController } from './initiatives.controller.js';

interface InitiativesRouterDeps {
  prisma: PrismaClient;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  getCachedState: <T>(key: string) => { value: T; stale: boolean } | null;
  isRefreshing: (key: string) => boolean;
  markRefreshing: (key: string, refreshing: boolean) => void;
  singleflight: <T>(key: string, factory: () => Promise<T>) => Promise<T>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  normalizeMilestoneOrder: (order: unknown, fallback?: number) => number;
  normalizeTaskOrder: (order: unknown, fallback?: number) => number;
  getCommonWhere: (req: any) => Record<string, string>;
}

export function createInitiativesRouter(deps: InitiativesRouterDeps) {
  const router = Router();
  const controller = createInitiativesController(deps);

  router.get('/api/initiatives', controller.getInitiatives);
  router.get('/api/initiatives/:id', controller.getInitiativeById);
  router.get('/api/initiatives/:id/history', controller.getInitiativeHistory);
  router.get('/api/initiatives/:id/comments', controller.getInitiativeComments);
  router.post('/api/initiatives/:id/comments', controller.createInitiativeComment);
  router.patch('/api/initiatives/:id/comments/:commentId', controller.updateInitiativeComment);
  router.delete('/api/initiatives/:id/comments/:commentId', controller.deleteInitiativeComment);
  router.post('/api/initiatives/:id/milestones', controller.createMilestone);
  router.patch('/api/initiatives/:id/milestones/:milestoneId', controller.updateMilestone);
  router.delete('/api/initiatives/:id/milestones/:milestoneId', controller.deleteMilestone);
  router.post('/api/initiatives', controller.createInitiative);
  router.patch('/api/initiatives/:id', controller.updateInitiative);
  router.delete('/api/initiatives/:id', controller.deleteInitiative);

  return router;
}
