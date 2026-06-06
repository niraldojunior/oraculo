import { createHash } from 'crypto';
import type express from 'express';

interface CreateImageServingHelpersDeps {
  getCachedImage: (key: string) => { hit: boolean; value: string | null };
  setCachedImage: (key: string, value: string | null) => void;
}

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

export function createImageServingHelpers(deps: CreateImageServingHelpersDeps) {
  const { getCachedImage, setCachedImage } = deps;

  async function serveEntityImage(
    req: express.Request,
    res: express.Response,
    fetcher: () => Promise<string | null | undefined>,
    cacheKey?: string
  ) {
    try {
      let value: string | null | undefined;
      if (cacheKey) {
        const cached = getCachedImage(cacheKey);
        if (cached.hit) {
          value = cached.value;
        } else {
          value = (await fetcher()) ?? null;
          setCachedImage(cacheKey, value);
        }
      } else {
        value = await fetcher();
      }
      if (!value) return res.status(404).end();
      if (!value.startsWith('data:')) return res.redirect(302, value);
      const parsed = parseDataUrl(value);
      if (!parsed) return res.status(415).end();
      const etag = `W/"${shortHash(value)}"`;
      if (req.headers['if-none-match'] === etag) return res.status(304).end();
      res.setHeader('Content-Type', parsed.mime);
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.setHeader('ETag', etag);
      return res.send(parsed.buf);
    } catch (error) {
      console.error('Image fetch failed:', error);
      return res.status(500).end();
    }
  }

  return {
    serveEntityImage
  };
}
