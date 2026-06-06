import type { PrismaClient } from '@prisma/client';

interface ImagesControllerDeps {
  prisma: PrismaClient;
  serveEntityImage: (
    req: any,
    res: any,
    fetcher: () => Promise<string | null | undefined>,
    cacheKey?: string
  ) => Promise<any>;
}

export function createImagesController(deps: ImagesControllerDeps) {
  const { prisma, serveEntityImage } = deps;

  const getCollaboratorImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      const row = await prisma.collaborator.findUnique({
        where: { id: req.params.id },
        select: { photoUrl: true, name: true }
      });
      if (!row) return null;
      if (row.photoUrl) return row.photoUrl;

      const initial = (row.name || '?').trim().charAt(0).toUpperCase() || '?';
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="47" fill="#E2E8F0"/><text x="48" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#475569">${initial}</text></svg>`;
      return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`;
    }, `img:collaborator:${req.params.id}`);
  };

  const getCompanyImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      const row = await prisma.company.findUnique({ where: { id: req.params.id }, select: { logo: true } });
      return row?.logo ?? null;
    }, `img:company:${req.params.id}`);
  };

  const getVendorImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      const row = await prisma.vendor.findUnique({ where: { id: req.params.id }, select: { logoUrl: true } });
      return row?.logoUrl ?? null;
    }, `img:vendor:${req.params.id}`);
  };

  const getSkillImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      const row = await prisma.skill.findUnique({ where: { id: req.params.id }, select: { icon: true } });
      return row?.icon ?? null;
    }, `img:skill:${req.params.id}`);
  };

  return {
    getCollaboratorImage,
    getCompanyImage,
    getVendorImage,
    getSkillImage
  };
}
