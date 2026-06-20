import type { PrismaClient } from '@prisma/client';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';

interface ImagesControllerDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
  serveEntityImage: (
    req: any,
    res: any,
    fetcher: () => Promise<string | null | undefined>,
    cacheKey?: string
  ) => Promise<any>;
}

export function createImagesController(deps: ImagesControllerDeps) {
  const { prisma, oracle, provider, serveEntityImage } = deps;

  const getCollaboratorImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      let row: { photoUrl?: string | null; name?: string | null } | null = null;

      if (prisma) {
        row = await prisma.collaborator.findUnique({
          where: { id: req.params.id },
          select: { photoUrl: true, name: true }
        });
      } else {
        if (!oracle) {
          throw new Error(`Images are not implemented for DB_PROVIDER=${provider}`);
        }

        const rows = await oracle.query<Record<string, unknown>>(
          'SELECT "photoUrl", "name" FROM "Collaborator" WHERE "id" = :id',
          { id: req.params.id }
        );
        const raw = rows[0];
        row = raw
          ? {
              photoUrl: (raw as any).photoUrl as string | null | undefined,
              name: (raw as any).name as string | null | undefined
            }
          : null;
      }

      if (!row) return null;
      if (row.photoUrl) return row.photoUrl;

      const initial = (row.name || '?').trim().charAt(0).toUpperCase() || '?';
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="47" fill="#E2E8F0"/><text x="48" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#475569">${initial}</text></svg>`;
      return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`;
    }, `img:collaborator:${req.params.id}`);
  };

  const getCompanyImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      if (prisma) {
        const row = await prisma.company.findUnique({ where: { id: req.params.id }, select: { logo: true } });
        return row?.logo ?? null;
      }

      if (!oracle) {
        throw new Error(`Images are not implemented for DB_PROVIDER=${provider}`);
      }

      const rows = await oracle.query<Record<string, unknown>>(
        'SELECT "logo" FROM "Company" WHERE "id" = :id',
        { id: req.params.id }
      );
      return ((rows[0] as any)?.logo as string | null | undefined) ?? null;
    }, `img:company:${req.params.id}`);
  };

  const getVendorImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      if (prisma) {
        const row = await prisma.vendor.findUnique({ where: { id: req.params.id }, select: { logoUrl: true } });
        return row?.logoUrl ?? null;
      }

      if (!oracle) {
        throw new Error(`Images are not implemented for DB_PROVIDER=${provider}`);
      }

      const rows = await oracle.query<Record<string, unknown>>(
        'SELECT "logoUrl" FROM "Vendor" WHERE "id" = :id',
        { id: req.params.id }
      );
      return ((rows[0] as any)?.logoUrl as string | null | undefined) ?? null;
    }, `img:vendor:${req.params.id}`);
  };

  const getSkillImage = async (req: any, res: any) => {
    return serveEntityImage(req, res, async () => {
      if (prisma) {
        const row = await prisma.skill.findUnique({ where: { id: req.params.id }, select: { icon: true } });
        return row?.icon ?? null;
      }

      if (!oracle) {
        throw new Error(`Images are not implemented for DB_PROVIDER=${provider}`);
      }

      const rows = await oracle.query<Record<string, unknown>>(
        'SELECT "icon" FROM "Skill" WHERE "id" = :id',
        { id: req.params.id }
      );
      return ((rows[0] as any)?.icon as string | null | undefined) ?? null;
    }, `img:skill:${req.params.id}`);
  };

  return {
    getCollaboratorImage,
    getCompanyImage,
    getVendorImage,
    getSkillImage
  };
}
