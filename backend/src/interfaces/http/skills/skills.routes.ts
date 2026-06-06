import { Router } from 'express';
import type { SkillApplicationService } from '../../../application/SkillApplicationService.js';
import { createSkillsController } from './skills.controller.js';

interface SkillsRouterDeps {
  skillService: SkillApplicationService;
  optimizeFieldInPlace: (obj: any, field: string, kind: any) => Promise<any>;
  invalidateImageCacheByPrefix: (prefix: string) => void;
  transformSkillImage: <T extends { id: string; icon?: string | null }>(s: T) => T;
  transformCollaboratorImage: <T extends { id: string; photoUrl?: string | null }>(c: T) => T;
  sanitizeSkill: (data: Record<string, any>) => Record<string, any>;
}

export function createSkillsRouter(deps: SkillsRouterDeps) {
  const router = Router();
  const controller = createSkillsController(deps);

  router.get('/api/skills', controller.getSkills);
  router.post('/api/skills', controller.createSkill);
  router.patch('/api/skills/:id', controller.updateSkill);
  router.delete('/api/skills/:id', controller.deleteSkill);

  return router;
}
