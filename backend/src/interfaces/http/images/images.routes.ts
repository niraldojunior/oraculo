import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createImagesController } from './images.controller.js';

interface ImagesRouterDeps {
  prisma: PrismaClient;
  serveEntityImage: (
    req: any,
    res: any,
    fetcher: () => Promise<string | null | undefined>,
    cacheKey?: string
  ) => Promise<any>;
}

export function createImagesRouter(deps: ImagesRouterDeps) {
  const router = Router();
  const controller = createImagesController(deps);

  router.get('/api/_img/collaborator/:id', controller.getCollaboratorImage);
  router.get('/api/_img/company/:id', controller.getCompanyImage);
  router.get('/api/_img/vendor/:id', controller.getVendorImage);
  router.get('/api/_img/skill/:id', controller.getSkillImage);

  return router;
}
