#!/usr/bin/env node
/* eslint-disable no-console */
// Backfill image optimization for already-stored base64 data URLs.
//
// Usage:
//   npx tsx scripts/optimize-images.ts --dry
//   npx tsx scripts/optimize-images.ts --only=collaborator,company
//   npx tsx scripts/optimize-images.ts                          # full run
//
// Targets:
//   collaborator.photoUrl  (kind: photo)
//   company.logo           (kind: logo)
//   vendor.logoUrl         (kind: logo)
//   skill.icon             (kind: icon)

import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { optimizeDataUrlImage, parseDataUrl, type ImageKind } from '../src/imageOptimizer';

// Load .env.local first if present (overrides .env).
const envLocal = resolve(process.cwd(), '.env.local');
if (existsSync(envLocal)) dotenvConfig({ path: envLocal, override: true });

const prisma = new PrismaClient();

type Target = {
  name: 'collaborator' | 'company' | 'vendor' | 'skill';
  kind: ImageKind;
  list: () => Promise<Array<{ id: string; value: string | null }>>;
  update: (id: string, value: string) => Promise<unknown>;
};

const TARGETS: Target[] = [
  {
    name: 'collaborator',
    kind: 'photo',
    list: async () => {
      const rows = await prisma.collaborator.findMany({ select: { id: true, photoUrl: true } });
      return rows.map(r => ({ id: r.id, value: r.photoUrl }));
    },
    update: (id, value) => prisma.collaborator.update({ where: { id }, data: { photoUrl: value } })
  },
  {
    name: 'company',
    kind: 'logo',
    list: async () => {
      const rows = await prisma.company.findMany({ select: { id: true, logo: true } });
      return rows.map(r => ({ id: r.id, value: r.logo }));
    },
    update: (id, value) => prisma.company.update({ where: { id }, data: { logo: value } })
  },
  {
    name: 'vendor',
    kind: 'logo',
    list: async () => {
      const rows = await prisma.vendor.findMany({ select: { id: true, logoUrl: true } });
      return rows.map(r => ({ id: r.id, value: r.logoUrl }));
    },
    update: (id, value) => prisma.vendor.update({ where: { id }, data: { logoUrl: value } })
  },
  {
    name: 'skill',
    kind: 'icon',
    list: async () => {
      const rows = await prisma.skill.findMany({ select: { id: true, icon: true } });
      return rows.map(r => ({ id: r.id, value: r.icon }));
    },
    update: (id, value) => prisma.skill.update({ where: { id }, data: { icon: value } })
  }
];

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const onlyArg = args.find(a => a.startsWith('--only='));
  const onlySet = onlyArg
    ? new Set(onlyArg.replace('--only=', '').split(',').map(s => s.trim()).filter(Boolean))
    : null;

  console.log(`[optimize-images] mode=${dry ? 'DRY' : 'WRITE'}${onlySet ? ` only=${[...onlySet].join(',')}` : ''}`);

  let grandBefore = 0;
  let grandAfter = 0;
  let grandTouched = 0;

  for (const target of TARGETS) {
    if (onlySet && !onlySet.has(target.name)) continue;

    const rows = await target.list();
    let totalBefore = 0;
    let totalAfter = 0;
    let touched = 0;

    console.log(`\n=== ${target.name} (${rows.length} rows, kind=${target.kind}) ===`);

    for (const row of rows) {
      if (!row.value || typeof row.value !== 'string' || !row.value.startsWith('data:')) continue;
      const parsed = parseDataUrl(row.value);
      if (!parsed) continue;

      const beforeBytes = parsed.buf.byteLength;
      const next = await optimizeDataUrlImage(row.value, target.kind);
      const newStr = typeof next === 'string' ? next : row.value;

      if (newStr === row.value) {
        continue;
      }
      const afterParsed = parseDataUrl(newStr);
      const afterBytes = afterParsed ? afterParsed.buf.byteLength : newStr.length;

      const saved = beforeBytes - afterBytes;
      if (saved <= 0) continue;

      totalBefore += beforeBytes;
      totalAfter += afterBytes;
      touched += 1;

      const pct = ((saved / beforeBytes) * 100).toFixed(1);
      console.log(`  ${row.id}  ${fmtBytes(beforeBytes)} -> ${fmtBytes(afterBytes)} (-${pct}%)`);

      if (!dry) {
        await target.update(row.id, newStr);
      }
    }

    if (touched === 0) {
      console.log('  (nothing to optimize)');
    } else {
      const pct = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : '0';
      console.log(`  TOTAL: ${touched} rows, ${fmtBytes(totalBefore)} -> ${fmtBytes(totalAfter)} (-${pct}%)`);
    }

    grandBefore += totalBefore;
    grandAfter += totalAfter;
    grandTouched += touched;
  }

  const pct = grandBefore > 0 ? ((1 - grandAfter / grandBefore) * 100).toFixed(1) : '0';
  console.log(`\n=== OVERALL: ${grandTouched} rows, ${fmtBytes(grandBefore)} -> ${fmtBytes(grandAfter)} (-${pct}%)${dry ? ' [DRY RUN, nothing written]' : ''} ===`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
