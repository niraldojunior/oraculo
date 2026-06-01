// Image optimization for fields stored as base64 data URLs in the database
// (Company.logo, Collaborator.photoUrl, Vendor.logoUrl, Skill.icon).
//
// We resize + re-encode to WebP (q80) so that uploads stay small and the
// /api/_img/* endpoints serve trim payloads. The function is a no-op when the
// input is not a data URL (e.g. external https URLs) or already optimized.

import sharp from 'sharp';

export type ImageKind = 'photo' | 'logo' | 'icon';

const PRESETS: Record<ImageKind, { width: number; height: number; quality: number }> = {
  // 256px is enough for any avatar/logo rendered at <= 96px on retina.
  photo: { width: 256, height: 256, quality: 80 },
  logo: { width: 256, height: 256, quality: 80 },
  // Skill icons are tiny on screen (<= 32px).
  icon: { width: 128, height: 128, quality: 80 }
};

// Skip images already smaller than this (≈ already optimized).
const SKIP_BYTES_THRESHOLD = 12 * 1024;

const DATA_URL_RE = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/;

export function parseDataUrl(value: string): { mime: string; buf: Buffer } | null {
  const match = DATA_URL_RE.exec(value);
  if (!match) return null;
  try {
    return { mime: match[1], buf: Buffer.from(match[2], 'base64') };
  } catch {
    return null;
  }
}

/**
 * Optimize a single base64 data URL image. Returns the new data URL or the
 * original value untouched when nothing can be done.
 */
export async function optimizeDataUrlImage(value: unknown, kind: ImageKind): Promise<unknown> {
  if (value == null) return value;
  if (typeof value !== 'string' || !value.startsWith('data:')) return value;

  const parsed = parseDataUrl(value);
  if (!parsed) return value;
  if (parsed.buf.byteLength <= SKIP_BYTES_THRESHOLD && parsed.mime === 'image/webp') {
    return value;
  }

  const preset = PRESETS[kind];
  try {
    const out = await sharp(parsed.buf, { failOn: 'none' })
      .rotate()
      .resize({
        width: preset.width,
        height: preset.height,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: preset.quality })
      .toBuffer();

    if (out.byteLength >= parsed.buf.byteLength && parsed.mime === 'image/webp') {
      return value;
    }
    return `data:image/webp;base64,${out.toString('base64')}`;
  } catch (error) {
    console.warn('[imageOptimizer] sharp failed, keeping original image:', (error as Error)?.message);
    return value;
  }
}

/**
 * Mutates `data` in place: when `field` holds a base64 data URL, replaces it
 * with the optimized version. Used inside POST/PATCH handlers.
 */
export async function optimizeFieldInPlace<T extends Record<string, any>>(
  data: T,
  field: string,
  kind: ImageKind
): Promise<T> {
  if (data && typeof data[field] === 'string') {
    const next = await optimizeDataUrlImage(data[field], kind);
    if (typeof next === 'string') {
      (data as any)[field] = next;
    }
  }
  return data;
}
