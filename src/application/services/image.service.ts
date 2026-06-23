import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { OracleService } from '../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service.js';

const DATA_URL_RE = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/;

function parseDataUrl(value: string): { mime: string; buf: Buffer } | null {
  const match = DATA_URL_RE.exec(value);
  if (!match) return null;

  try {
    return { mime: match[1], buf: Buffer.from(match[2], 'base64') };
  } catch {
    return null;
  }
}

function shortHash(value: string): string {
  return createHash('sha1').update(value).digest('base64url').slice(0, 12);
}

@Injectable()
export class ImageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly oracle: OracleService
  ) {}

  serveCollaboratorImage(req: Request, res: Response, id: string): Promise<void> {
    return this.serveEntityImage(req, res, async () => {
      const provider = this.dbProvider();

      if (provider === 'oracle') {
        const rows = await this.oracle.query<Record<string, unknown>>(
          'SELECT "photoUrl", "name" FROM "Collaborator" WHERE "id" = :id',
          { id }
        );

        const row = rows[0];
        if (!row) return null;

        const photoUrl = (row.photoUrl as string | null | undefined) ?? null;
        if (photoUrl) return photoUrl;

        const name = String(row.name ?? '?');
        return this.collaboratorFallback(name);
      }

      const row = await this.prisma.collaborator.findUnique({
        where: { id },
        select: { photoUrl: true, name: true }
      });

      if (!row) return null;
      if (row.photoUrl) return row.photoUrl;

      return this.collaboratorFallback(row.name ?? '?');
    });
  }

  serveCompanyImage(req: Request, res: Response, id: string): Promise<void> {
    return this.serveEntityImage(req, res, async () => {
      const provider = this.dbProvider();

      if (provider === 'oracle') {
        const rows = await this.oracle.query<Record<string, unknown>>(
          'SELECT "logo" FROM "Company" WHERE "id" = :id',
          { id }
        );

        return ((rows[0] as any)?.logo as string | null | undefined) ?? null;
      }

      const row = await this.prisma.company.findUnique({
        where: { id },
        select: { logo: true }
      });

      return row?.logo ?? null;
    });
  }

  serveVendorImage(req: Request, res: Response, id: string): Promise<void> {
    return this.serveEntityImage(req, res, async () => {
      const provider = this.dbProvider();

      if (provider === 'oracle') {
        const rows = await this.oracle.query<Record<string, unknown>>(
          'SELECT "logoUrl" FROM "Vendor" WHERE "id" = :id',
          { id }
        );

        return ((rows[0] as any)?.logoUrl as string | null | undefined) ?? null;
      }

      const row = await this.prisma.vendor.findUnique({
        where: { id },
        select: { logoUrl: true }
      });

      return row?.logoUrl ?? null;
    });
  }

  serveSkillImage(req: Request, res: Response, id: string): Promise<void> {
    return this.serveEntityImage(req, res, async () => {
      const provider = this.dbProvider();

      if (provider === 'oracle') {
        const rows = await this.oracle.query<Record<string, unknown>>(
          'SELECT "icon" FROM "Skill" WHERE "id" = :id',
          { id }
        );

        return ((rows[0] as any)?.icon as string | null | undefined) ?? null;
      }

      const row = await this.prisma.skill.findUnique({
        where: { id },
        select: { icon: true }
      });

      return row?.icon ?? null;
    });
  }

  private dbProvider(): string {
    return String(this.configService.get<string>('env.dbProvider') ?? 'supabase');
  }

  private collaboratorFallback(name: string): string {
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="47" fill="#E2E8F0"/><text x="48" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#475569">${initial}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`;
  }

  private async serveEntityImage(
    req: Request,
    res: Response,
    fetcher: () => Promise<string | null | undefined>
  ): Promise<void> {
    try {
      const value = await fetcher();
      if (!value) {
        res.status(404).end();
        return;
      }

      if (!value.startsWith('data:')) {
        res.redirect(302, value);
        return;
      }

      const parsed = parseDataUrl(value);
      if (!parsed) {
        res.status(415).end();
        return;
      }

      const etag = `W/"${shortHash(value)}"`;
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }

      res.setHeader('Content-Type', parsed.mime);
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.setHeader('ETag', etag);
      res.send(parsed.buf);
    } catch {
      res.status(500).end();
    }
  }
}
