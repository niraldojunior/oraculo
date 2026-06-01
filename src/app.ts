// ================== APP.TS STARTING ==================

import express from 'express';
import type { Response as ExpressResponse } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';
import { createHash } from 'crypto';
import { optimizeFieldInPlace } from './imageOptimizer.js';

process.stderr.write('\n=== APP.TS CODE IS EXECUTING ===\n');

console.log('[app.ts] Module loading...');

// Carregar .env.local primeiro, depois .env, depois usar values padrão
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

// Detect serverless (Vercel, AWS Lambda, etc.). In serverless each invocation
// spins its own Prisma client, so a large pool per instance multiplied by
// concurrent invocations quickly exhausts the upstream pgbouncer pool.
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

const PRISMA_POOL_MIN_CONNECTIONS = Number(process.env.PRISMA_POOL_MIN_CONNECTIONS || (IS_SERVERLESS ? 1 : 10));
const PRISMA_POOL_TIMEOUT_SECONDS = Number(process.env.PRISMA_POOL_TIMEOUT_SECONDS || (IS_SERVERLESS ? 10 : 20));
const PRISMA_POOL_KEEPALIVE_MS = Number(process.env.PRISMA_POOL_KEEPALIVE_MS || 60000);
const PRISMA_QUERY_LOG_ENABLED = (process.env.PRISMA_QUERY_LOG_ENABLED || 'true').toLowerCase() !== 'false';
const PRISMA_QUERY_LOG_PARAMS = (process.env.PRISMA_QUERY_LOG_PARAMS || 'true').toLowerCase() !== 'false';

function withPrismaPoolTuning(databaseUrl?: string) {
  if (!databaseUrl) return undefined;
  try {
    const url = new URL(databaseUrl);
    const rawLimit = url.searchParams.get('connection_limit');
    const parsedLimit = rawLimit ? Number(rawLimit) : NaN;

    if (IS_SERVERLESS) {
      // Force a small, fixed pool per serverless instance.
      url.searchParams.set('connection_limit', String(PRISMA_POOL_MIN_CONNECTIONS));
    } else if (!Number.isFinite(parsedLimit) || parsedLimit < PRISMA_POOL_MIN_CONNECTIONS) {
      url.searchParams.set('connection_limit', String(PRISMA_POOL_MIN_CONNECTIONS));
    }

    url.searchParams.set('pool_timeout', String(PRISMA_POOL_TIMEOUT_SECONDS));

    return url.toString();
  } catch {
    console.warn('[app.ts] DATABASE_URL is not a valid URL, skipping pool tuning');
    return databaseUrl;
  }
}

const tunedDatabaseUrl = withPrismaPoolTuning(process.env.DATABASE_URL);

const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  ...(tunedDatabaseUrl
    ? {
        datasources: {
          db: { url: tunedDatabaseUrl }
        }
      }
    : {}),
  ...(PRISMA_QUERY_LOG_ENABLED
    ? {
        log: [{ emit: 'event', level: 'query' }]
      }
    : {})
};

console.log('[app.ts] Creating Prisma client...');
const prisma = new PrismaClient(prismaClientOptions);
console.log('[app.ts] Prisma client created');
if (tunedDatabaseUrl) {
  console.log(`[app.ts] Prisma pool tuned: connection_limit>=${PRISMA_POOL_MIN_CONNECTIONS}`);
}
if (PRISMA_QUERY_LOG_ENABLED) {
  console.log(`[app.ts] Prisma query logging enabled (params=${PRISMA_QUERY_LOG_PARAMS})`);
  const NOISY_SQL = /^(BEGIN|COMMIT|ROLLBACK|DEALLOCATE|SELECT 1)\b/i;
  (prisma as any).$on('query', (event: any) => {
    if (NOISY_SQL.test(String(event.query).trim())) return;
    const params = PRISMA_QUERY_LOG_PARAMS ? ` | params=${event.params}` : '';
    console.log(`[db.query] ${event.duration}ms | target=${event.target} | sql=${event.query}${params}`);
  });
}
const app = express();

type CacheEntry = {
  expiresAt: number;
  staleAt: number;
  value: unknown;
  refreshing?: boolean;
};

type ImageCacheEntry = {
  expiresAt: number;
  value: string | null;
};

// Stale-While-Revalidate:
//   staleAt   = ponto em que o cache passa a ser servido como "stale" e dispara refresh em background.
//   expiresAt = ponto em que o cache é descartado e a próxima request paga o custo total de DB.
// Como POST/PATCH/DELETE já invalidam o cache, podemos ser generosos no TTL.
const API_CACHE_STALE_MS = Number(process.env.API_CACHE_STALE_MS || 60000);
const API_CACHE_TTL_MS = Number(process.env.API_CACHE_TTL_MS || 300000);
const apiCache = new Map<string, CacheEntry>();
const apiSingleflight = new Map<string, Promise<unknown>>();
const IMAGE_CACHE_TTL_MS = Number(process.env.IMAGE_CACHE_TTL_MS || 300000);
const imageCache = new Map<string, ImageCacheEntry>();

function buildCacheKey(resource: string, where?: Record<string, unknown>) {
  return `${resource}:${JSON.stringify(where || {})}`;
}

function getCachedState<T>(key: string): { value: T; stale: boolean } | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (entry.expiresAt < now) {
    apiCache.delete(key);
    return null;
  }
  return { value: entry.value as T, stale: entry.staleAt < now };
}

function isRefreshing(key: string): boolean {
  return apiCache.get(key)?.refreshing === true;
}

function markRefreshing(key: string, refreshing: boolean) {
  const entry = apiCache.get(key);
  if (entry) entry.refreshing = refreshing;
}

function setCached(key: string, value: unknown) {
  const now = Date.now();
  apiCache.set(key, {
    value,
    staleAt: now + API_CACHE_STALE_MS,
    expiresAt: now + API_CACHE_TTL_MS
  });
}

async function singleflight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = apiSingleflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = (async () => {
    try {
      return await factory();
    } finally {
      apiSingleflight.delete(key);
    }
  })();
  apiSingleflight.set(key, promise);
  return promise;
}

// Stale-While-Revalidate response helper. Serves cache when present (even if stale),
// triggering a background refresh in the stale window. On MISS, fetches inline.
async function serveSWR<T>(
  res: ExpressResponse,
  cacheKey: string,
  fetchFresh: () => Promise<T>,
  logLabel: string
): Promise<void> {
  const state = getCachedState<T>(cacheKey);
  if (state) {
    if (state.stale && !isRefreshing(cacheKey)) {
      markRefreshing(cacheKey, true);
      singleflight(cacheKey, fetchFresh)
        .catch(err => console.error('SWR refresh failed for', cacheKey, err))
        .finally(() => markRefreshing(cacheKey, false));
    }
    const count = Array.isArray(state.value) ? (state.value as any[]).length : 1;
    console.log('Found', count, logLabel, `| cacheHit=true${state.stale ? ' stale' : ''}`);
    res.json(state.value);
    return;
  }
  const fresh = await singleflight(cacheKey, fetchFresh);
  res.json(fresh);
}

function invalidateCacheByPrefix(prefix: string) {
  for (const key of apiCache.keys()) {
    if (key.startsWith(`${prefix}:`)) {
      apiCache.delete(key);
    }
  }
  // Agregadores derivam destes recursos; precisam ser invalidados em conjunto
  // para não devolver inventário/contexto desatualizado após writes.
  if (AGGREGATE_DEPENDENCIES.has(prefix)) {
    for (const aggregate of AGGREGATE_PREFIXES) {
      for (const key of apiCache.keys()) {
        if (key.startsWith(`${aggregate}:`)) apiCache.delete(key);
      }
    }
  }
  // Cache de auth/me derivado de collaborator
  if (prefix === 'collaborators') {
    for (const key of apiCache.keys()) {
      if (key.startsWith('auth-collaborator:')) apiCache.delete(key);
    }
  }
}

const AGGREGATE_PREFIXES = ['inventory-context', 'vendors-context'];
const AGGREGATE_DEPENDENCIES = new Set([
  'systems', 'teams', 'collaborators', 'vendors', 'departments', 'companies'
]);

function getCachedImage(key: string): { hit: boolean; value: string | null } {
  const entry = imageCache.get(key);
  if (!entry) return { hit: false, value: null };
  if (entry.expiresAt < Date.now()) {
    imageCache.delete(key);
    return { hit: false, value: null };
  }
  return { hit: true, value: entry.value };
}

function setCachedImage(key: string, value: string | null) {
  imageCache.set(key, {
    value,
    expiresAt: Date.now() + IMAGE_CACHE_TTL_MS
  });
}

function invalidateImageCacheByPrefix(prefix: string) {
  for (const key of imageCache.keys()) {
    if (key.startsWith(prefix)) {
      imageCache.delete(key);
    }
  }
}

function normalizeTaskOrder(order: unknown, fallback = 0) {
  return Number.isInteger(order) ? Number(order) : fallback;
}

function normalizeMilestoneOrder(order: unknown, fallback = 0) {
  return Number.isInteger(order) ? Number(order) : fallback;
}

async function repairNullMilestoneTaskOrders() {
  try {
    const repaired = await prisma.$executeRawUnsafe('UPDATE "MilestoneTask" SET "order" = 0 WHERE "order" IS NULL');
    if (repaired > 0) {
      console.log(`[app.ts] Repaired ${repaired} milestone task records with null order`);
    }
  } catch (error) {
    console.warn('[app.ts] Milestone task order repair skipped:', error);
  }
}

async function repairNullInitiativeMilestoneOrders() {
  try {
    const repaired = await prisma.$executeRawUnsafe('UPDATE "InitiativeMilestone" SET "order" = 0 WHERE "order" IS NULL');
    if (repaired > 0) {
      console.log(`[app.ts] Repaired ${repaired} initiative milestone records with null order`);
    }
  } catch (error) {
    console.warn('[app.ts] Initiative milestone order repair skipped:', error);
  }
}

// Test database connection on startup (long-lived server only — skipped in serverless).
if (!IS_SERVERLESS) (async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');

    // Warm pool connections with concurrent lightweight queries.
    await Promise.all(
      Array.from({ length: PRISMA_POOL_MIN_CONNECTIONS }, () => prisma.$queryRaw`SELECT 1`)
    );
    console.log(`✓ Prisma pool pre-warmed with up to ${PRISMA_POOL_MIN_CONNECTIONS} concurrent pings`);

    const keepAliveTimer = setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        console.warn('[app.ts] Prisma pool keepalive failed:', error);
      }
    }, PRISMA_POOL_KEEPALIVE_MS);
    keepAliveTimer.unref();

    await repairNullInitiativeMilestoneOrders();
    await repairNullMilestoneTaskOrders();
  } catch (error) {
    console.error('✗ Database connection failed:', error);
  }
})();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// --- Dedicated image endpoints (served with ETag + Cache-Control max-age=3600) ---
app.get('/api/_img/collaborator/:id', (req, res) => {
  serveEntityImage(req, res, async () => {
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
});
app.get('/api/_img/company/:id', (req, res) => {
  serveEntityImage(req, res, async () => {
    const row = await prisma.company.findUnique({ where: { id: req.params.id }, select: { logo: true } });
    return row?.logo ?? null;
  }, `img:company:${req.params.id}`);
});
app.get('/api/_img/vendor/:id', (req, res) => {
  serveEntityImage(req, res, async () => {
    const row = await prisma.vendor.findUnique({ where: { id: req.params.id }, select: { logoUrl: true } });
    return row?.logoUrl ?? null;
  }, `img:vendor:${req.params.id}`);
});
app.get('/api/_img/skill/:id', (req, res) => {
  serveEntityImage(req, res, async () => {
    const row = await prisma.skill.findUnique({ where: { id: req.params.id }, select: { icon: true } });
    return row?.icon ?? null;
  }, `img:skill:${req.params.id}`);
});

// Auth Endpoints
app.post('/api/auth/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  // Normalize email
  email = email.trim().toLowerCase();

  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        isAdmin: true,
        companyId: true,
        departmentId: true,
        role: true,
        associatedCompanyIds: true
      }
    });

    if (collaborator && (collaborator as any).password === password) {
      return res.json({
        user: collaborator,
        isAdmin: (collaborator as any).isAdmin || false,
        type: 'collaborator'
      });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Login error detail:', error);
    res.status(500).json({ error: 'Erro interno no servidor (Banco de dados)' });
  }
});


app.get('/api/collaborators/email/:email', async (req, res) => {
  const { email } = req.params;
  const cacheKey = buildCacheKey('auth-collaborator', { email });
  try {
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const collaborator = await prisma.collaborator.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
          departmentId: true,
          photoUrl: true,
          phone: true,
          bio: true,
          linkedinUrl: true,
          githubUrl: true,
          isAdmin: true,
          skills: true,
          squadId: true,
          associatedCompanyIds: true
        }
      });
      console.log('auth-collaborator', email, `| dbQueryMs=${Date.now() - queryStart}`);
      if (collaborator) setCached(cacheKey, collaborator);
      return collaborator;
    }, `auth-collaborator ${email}`);
  } catch (error) {
    console.error('API Error /api/collaborators/email/:email [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch collaborator data (Database error)' });
  }
});

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/systems', async (req, res) => {
  try {
    const { companyId } = req.query;
    const where = companyId ? { companyId: companyId as string } : getCommonWhere(req);
    const cacheKey = buildCacheKey('systems', where);
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const systems = await prisma.system.findMany({ where, omit: systemListOmit });
      console.log('Found', systems.length, 'systems', `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, systems);
      return systems;
    }, 'systems');
  } catch (error) {
    console.error('API Error /api/systems [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch systems' });
  }
});

app.get('/api/inventory-context', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    const { companyId } = req.query;
    const cacheKey = buildCacheKey('inventory-context', { ...where, companyId: companyId ?? null });
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const [systems, teams, collaborators, vendors, departments] = await Promise.all([
        prisma.system.findMany({ where, omit: systemListOmit }),
        prisma.team.findMany({ where }),
        prisma.collaborator.findMany({ where, select: collaboratorSafeSelect }),
        prisma.vendor.findMany({ where }),
        prisma.department.findMany({ where: companyId ? { companyId: companyId as string } : undefined })
      ]);
      const payload = {
        systems,
        teams,
        collaborators: collaborators.map(transformCollaboratorImage),
        vendors: vendors.map(transformVendorImage),
        departments
      };
      console.log('inventory-context built', `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, payload);
      return payload;
    }, 'inventory-context');
  } catch (error) {
    console.error('API Error /api/inventory-context [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch inventory context' });
  }
});

app.get('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const system = await prisma.system.findUnique({
      where: { id }
    });
    if (!system) return res.status(404).json({ error: 'System not found' });
    res.json(system);
  } catch (error) {
    console.error('API Error /api/systems/:id [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch system' });
  }
});

const VALID_SYSTEM_FIELDS = new Set([
  'id', 'name', 'platformName', 'domain', 'subDomain', 'criticality',
  'techStack', 'ownerTeamId', 'smeId', 'lifecycleStatus', 'debtScore',
  'description', 'platformCategory', 'vendorId', 'repoUrl', 'environments', 'contextFiles',
  'companyId', 'departmentId'
]);

function sanitizeSystem(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_SYSTEM_FIELDS.has(key)) clean[key] = data[key];
  }
  // Sanitize optional relation IDs
  if (clean.ownerTeamId === '') clean.ownerTeamId = null;
  if (clean.smeId === '') clean.smeId = null;
  if (clean.vendorId === '') clean.vendorId = null;
  return clean;
}

const VALID_COLLABORATOR_FIELDS = new Set([
  'name', 'email', 'role', 'squadId', 'photoUrl', 'phone', 'bio', 'linkedinUrl', 'githubUrl',
  'companyId', 'departmentId', 'password', 'isAdmin', 'birthday', 'vacationStart', 'associatedCompanyIds',
  'startDate', 'endDate', 'uf'
]);

function sanitizeCollaborator(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_COLLABORATOR_FIELDS.has(key)) clean[key] = data[key];
  }
  if (clean.squadId === '') clean.squadId = null;
  if (clean.departmentId === '') clean.departmentId = null;
  if (clean.companyId === '') clean.companyId = null;
  if (clean.vacationStart === '') clean.vacationStart = null;
  if (clean.startDate === '') clean.startDate = null;
  if (clean.endDate === '') clean.endDate = null;
  if (clean.birthday === '') clean.birthday = null;

  // Role mappings and normalizations
  if (clean.role === 'VP') clean.role = 'Head';
  if (clean.role === 'Engineer/Analyst' || clean.role === 'ENGINEER/ANALYST') clean.role = 'Engineer';

  stripImageRefFields(clean, ['photoUrl']);
  return clean;
}

const VALID_TEAM_FIELDS = new Set([
  'name', 'type', 'parentTeamId', 'leaderId', 'companyId', 'departmentId', 'receivesInitiatives'
]);

function sanitizeTeam(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_TEAM_FIELDS.has(key)) clean[key] = data[key];
  }
  if (clean.parentTeamId === '') clean.parentTeamId = null;
  if (clean.leaderId === '') clean.leaderId = null;
  return clean;
}



// Helper to ensure companyId matches department's companyId
async function ensureCompanyMatchesDept(data: any) {
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { companyId: true }
    });
    if (dept) {
      if (data.companyId && data.companyId !== dept.companyId) {
        throw new Error('Departamento informado pertence a outra empresa.');
      }
      data.companyId = dept.companyId;
    }
  }
  return data;
}

// Helper for context filtering
function getCommonWhere(req: express.Request) {
  const { companyId, departmentId } = req.query;
  const where: any = {};
  if (companyId) where.companyId = companyId as string;
  if (departmentId) where.departmentId = departmentId as string;
  return where;
}

// ---------- Image helpers (base64 -> /api/_img/* refs) -------------------
// Heavy base64 image columns (Collaborator.photoUrl, Company.logo, Vendor.logoUrl,
// Skill.icon) are not selected on list endpoints. Instead transforms emit a
// stable URL like /api/_img/<kind>/<id> that the browser can cache (ETag + 1h).
const DATA_URL_RE = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/;
function parseDataUrl(value: string): { mime: string; buf: Buffer } | null {
  const match = DATA_URL_RE.exec(value);
  if (!match) return null;
  try { return { mime: match[1], buf: Buffer.from(match[2], 'base64') }; } catch { return null; }
}
function shortHash(value: string): string {
  return createHash('sha1').update(value).digest('base64url').slice(0, 12);
}
function isImageRefUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/api/_img/');
}
function imageRef(value: string | null | undefined, kind: 'collaborator' | 'company' | 'vendor' | 'skill', id: string): string | null | undefined {
  if (value == null || value === '') return value;
  if (value.startsWith('/api/_img/')) return value;
  if (value.startsWith('data:')) return `/api/_img/${kind}/${id}`;
  return value;
}
// Use on PATCH/POST sanitizers so the client doesn't overwrite the stored image
// with a ref URL when it just resubmits the form unchanged.
function stripImageRefFields<T extends Record<string, any>>(data: T, fields: string[]): T {
  for (const f of fields) {
    if (isImageRefUrl(data[f])) delete data[f];
  }
  return data;
}
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
function transformCollaboratorImage<T extends { id: string; photoUrl?: string | null }>(c: T): T {
  if (!c) return c;
  if (c.photoUrl) (c as any).photoUrl = imageRef(c.photoUrl, 'collaborator', c.id);
  else if ((c as any).photoUrl === undefined) (c as any).photoUrl = `/api/_img/collaborator/${c.id}`;
  return c;
}
function transformCompanyImage<T extends { id: string; logo?: string | null }>(c: T): T {
  if (!c) return c;
  if (c.logo) (c as any).logo = imageRef(c.logo, 'company', c.id);
  else if ((c as any).logo === undefined) (c as any).logo = `/api/_img/company/${c.id}`;
  return c;
}
function transformVendorImage<T extends { id: string; logoUrl?: string | null }>(v: T): T {
  if (!v) return v;
  if (v.logoUrl) (v as any).logoUrl = imageRef(v.logoUrl, 'vendor', v.id);
  else if ((v as any).logoUrl === undefined) (v as any).logoUrl = `/api/_img/vendor/${v.id}`;
  return v;
}
function transformSkillImage<T extends { id: string; icon?: string | null }>(s: T): T {
  if (!s) return s;
  if (s.icon) (s as any).icon = imageRef(s.icon, 'skill', s.id);
  else if ((s as any).icon === undefined) (s as any).icon = `/api/_img/skill/${s.id}`;
  return s;
}
// Heavy JSON / base64 columns kept out of list payloads.
const systemListOmit = { contextFiles: true } as const;
const companyListOmit = { logo: true } as const;
// -----------------------------------------------------------------------

const collaboratorSafeSelect = {
  id: true,
  companyId: true,
  departmentId: true,
  name: true,
  email: true,
  role: true,
  squadId: true,
  // photoUrl intentionally excluded: served via /api/_img/collaborator/:id.
  phone: true,
  bio: true,
  linkedinUrl: true,
  githubUrl: true,
  isAdmin: true,
  associatedCompanyIds: true,
  vacationStart: true,
  startDate: true,
  endDate: true
} as const;

const collaboratorDashboardSelect = {
  id: true,
  companyId: true,
  departmentId: true,
  name: true,
  email: true,
  role: true,
  squadId: true,
  phone: true,
  bio: true,
  linkedinUrl: true,
  githubUrl: true,
  isAdmin: true,
  associatedCompanyIds: true,
  vacationStart: true,
  startDate: true,
  endDate: true
} as const;

const VALID_INITIATIVE_SCALAR_FIELDS = new Set([
  'title', 'type', 'benefit', 'benefitType', 'scope', 'customerOwner',
  'originDirectorate', 'leaderId', 'technicalLeadId', 'impactedSystemIds',
  'requestDate', 'businessExpectationDate', 'status', 'previousStatus', 'companyId', 'departmentId', 'executingDirectorate', 'executingTeamId', 'rationale', 'externalLinkType', 'externalLinkName', 'externalLinkUrl', 'macroScope', 'createdById', 'assignedManagerId', 'initiativeType', 'priority', 'memberIds', 'startDate', 'endDate', 'actualEndDate'
]);


function sanitizeInitiative(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_INITIATIVE_SCALAR_FIELDS.has(key)) {
      clean[key] = data[key];
    }
  }
  if (clean.benefitType === '') clean.benefitType = null;
  if (clean.technicalLeadId === '') clean.technicalLeadId = null;
  if (clean.businessExpectationDate === '') clean.businessExpectationDate = null;
  if (clean.previousStatus === '') clean.previousStatus = null;
  return clean;
}

app.post('/api/systems', async (req, res) => {
  try {
    const data = sanitizeSystem(req.body);
    delete data.id;
    await ensureCompanyMatchesDept(data);

    const system = await prisma.system.create({ data: data as any });
    invalidateCacheByPrefix('systems');
    res.json(system);
  } catch (error: any) {
    console.error('API Error /api/systems [POST]:', error);
    res.status(500).json({ error: 'Failed to create system', details: error.message });
  }
});

app.patch('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeSystem(req.body);
    delete data.id;
    await ensureCompanyMatchesDept(data);

    const system = await prisma.system.update({
      where: { id },
      data: data as any
    });
    invalidateCacheByPrefix('systems');
    res.json(system);
  } catch (error: any) {
    console.error('API Error /api/systems/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update system', details: error.message });
  }
});

app.delete('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.system.delete({
      where: { id }
    });
    invalidateCacheByPrefix('systems');
    res.json({ message: 'System deleted' });
  } catch (error: any) {
    console.error('API Error /api/systems/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete system', details: error.message });
  }
});

app.get('/api/initiatives', async (req, res) => {
  try {
    const lite = String(req.query.lite || 'false').toLowerCase() === 'true';
    const where = getCommonWhere(req);
    const cacheKey = buildCacheKey('initiatives', { ...where, lite });

    const fetchFresh = async () => {
      const queryStart = Date.now();
      if (lite) {
        const initiatives = await prisma.initiative.findMany({
          where,
          orderBy: { createdAt: 'desc' }
        });
        const queryMs = Date.now() - queryStart;
        console.log('Found', initiatives.length, 'initiatives', `| dbQueryMs=${queryMs}`, '| lite=true');
        setCached(cacheKey, initiatives);
        return initiatives;
      }

      const [initiatives, progressRows] = await Promise.all([
        prisma.initiative.findMany({ where, orderBy: { createdAt: 'desc' } }),
        prisma.$queryRaw<Array<{ initiativeId: string; tasksTotal: bigint; tasksDone: bigint }>>`
          SELECT m."initiativeId" AS "initiativeId",
                 COUNT(t.id)::bigint AS "tasksTotal",
                 COUNT(t.id) FILTER (WHERE t.status = 'Done')::bigint AS "tasksDone"
          FROM "public"."InitiativeMilestone" m
          LEFT JOIN "public"."MilestoneTask" t ON t."milestoneId" = m.id
          WHERE m."initiativeId" IN (
            SELECT id FROM "public"."Initiative"
            WHERE (${where.companyId ?? null}::text IS NULL OR "companyId" = ${where.companyId ?? null}::text)
              AND (${where.departmentId ?? null}::text IS NULL OR "departmentId" = ${where.departmentId ?? null}::text)
          )
          GROUP BY m."initiativeId"
        `
      ]);
      const progressMap = new Map<string, { tasksTotal: number; tasksDone: number }>();
      for (const row of progressRows) {
        progressMap.set(row.initiativeId, {
          tasksTotal: Number(row.tasksTotal),
          tasksDone: Number(row.tasksDone)
        });
      }
      const enriched = initiatives.map(it => ({
        ...it,
        _progress: progressMap.get(it.id) || { tasksTotal: 0, tasksDone: 0 }
      }));
      const queryMs = Date.now() - queryStart;
      console.log('Found', enriched.length, 'initiatives', `| dbQueryMs=${queryMs}`, '| lite=false');
      setCached(cacheKey, enriched);
      return enriched;
    };

    const state = getCachedState<any[]>(cacheKey);
    if (state) {
      if (state.stale && !isRefreshing(cacheKey)) {
        markRefreshing(cacheKey, true);
        singleflight(cacheKey, fetchFresh)
          .catch(err => console.error('SWR refresh failed for', cacheKey, err))
          .finally(() => markRefreshing(cacheKey, false));
      }
      console.log('Found', state.value.length, 'initiatives', `| cacheHit=true${state.stale ? ' stale' : ''}`, `| lite=${lite}`);
      return res.json(state.value);
    }
    const fresh = await singleflight(cacheKey, fetchFresh);
    return res.json(fresh);
  } catch (error) {
    console.error('API Error /api/initiatives [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch initiatives' });
  }
});

app.get('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = buildCacheKey('initiatives', { detail: id });
  try {
    const state = getCachedState<any>(cacheKey);
    const fetchFresh = async () => {
      const queryStart = Date.now();
      const initiative = await prisma.initiative.findUnique({
        where: { id },
        include: {
          milestones: {
            orderBy: { order: 'asc' },
            include: {
              tasks: { orderBy: { order: 'asc' } }
            }
          }
        }
      });
      console.log('initiative detail', id, `| dbQueryMs=${Date.now() - queryStart}`);
      if (initiative) {
        const payload = { ...initiative, history: [], comments: [] };
        setCached(cacheKey, payload);
        return payload;
      }
      return null;
    };
    if (state) {
      if (state.stale && !isRefreshing(cacheKey)) {
        markRefreshing(cacheKey, true);
        singleflight(cacheKey, fetchFresh)
          .catch(err => console.error('SWR refresh failed for', cacheKey, err))
          .finally(() => markRefreshing(cacheKey, false));
      }
      console.log('initiative detail', id, `| cacheHit=true${state.stale ? ' stale' : ''}`);
      return res.json(state.value);
    }
    const fresh = await singleflight(cacheKey, fetchFresh);
    if (!fresh) return res.status(404).json({ error: 'Initiative not found' });
    res.json(fresh);
  } catch (error) {
    console.error('API Error /api/initiatives/:id [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch initiative' });
  }
});

app.get('/api/initiatives/:id/history', async (req, res) => {
  const { id } = req.params;
  const cacheKey = buildCacheKey('initiatives', { history: id });
  try {
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const history = await prisma.initiativeHistory.findMany({
        where: { initiativeId: id },
        orderBy: { timestamp: 'desc' }
      });
      console.log('initiative history', id, `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, history);
      return history;
    }, `initiative-history ${id}`);
  } catch (error) {
    console.error('API Error /api/initiatives/:id/history [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch initiative history' });
  }
});

app.get('/api/initiatives/:id/comments', async (req, res) => {
  const { id } = req.params;
  const cacheKey = buildCacheKey('initiatives', { comments: id });
  try {
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const comments = await prisma.initiativeComment.findMany({
        where: { initiativeId: id },
        orderBy: { timestamp: 'desc' }
      });
      console.log('initiative comments', id, `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, comments);
      return comments;
    }, `initiative-comments ${id}`);
  } catch (error) {
    console.error('API Error /api/initiatives/:id/comments [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch initiative comments' });
  }
});

app.post('/api/initiatives', async (req, res) => {
  const { milestones, history, comments, ...rawRest } = req.body;
  const rest = sanitizeInitiative(rawRest);
  try {
    const initiative = await prisma.initiative.create({
      data: {
        ...rest,
        milestones: {
          create: milestones?.map((m: any, milestoneIndex: number) => ({
            name: m.name,
            systemId: m.systemId,
            baselineDate: m.baselineDate,
            realDate: m.realDate,
            description: m.description,
            assignedEngineerId: m.assignedEngineerId,
            startDate: m.startDate,
            order: normalizeMilestoneOrder(m.order, milestoneIndex),
            tasks: {
              create: m.tasks?.map((t: any, taskIndex: number) => ({
                name: t.name,
                status: t.status,
                type: t.type,
                assigneeId: t.assigneeId,
                startDate: t.startDate,
                systemId: t.systemId,
                targetDate: t.targetDate,
                notes: t.notes,
                order: normalizeTaskOrder(t.order, taskIndex)
              }))
            }
          }))
        },
        history: {
          create: history?.map((h: any) => ({
            timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
            user: h.user,
            action: h.action,
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            notes: h.notes
          }))
        },
        comments: {
          create: comments?.map((c: any) => ({
            content: c.content,
            userId: c.userId,
            userName: c.userName,
            userPhoto: c.userPhoto,
            timestamp: c.timestamp ? new Date(c.timestamp) : new Date()
          }))
        }
      } as any,
      include: {
        milestones: { include: { tasks: true } },
        history: true,
        comments: true
      }
    });
    invalidateCacheByPrefix('initiatives');
    res.json(initiative);
  } catch (error: any) {
    console.error('API Error /api/initiatives [POST]:', error);
    res.status(500).json({ error: 'Failed to create initiative', details: error.message });
  }
});


app.patch('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  const { milestones, history, comments, removedMilestoneIds, ...rawRest } = req.body;
  const rest = sanitizeInitiative(rawRest);

  try {
    // Atualiza os campos simples da iniciativa
    await prisma.initiative.update({
      where: { id },
      data: rest,
    });

    if (Array.isArray(removedMilestoneIds) && removedMilestoneIds.length > 0) {
      await prisma.initiativeMilestone.deleteMany({
        where: {
          initiativeId: id,
          id: { in: removedMilestoneIds }
        }
      });
    }

    // Atualiza/cria apenas os milestones alterados
    if (Array.isArray(milestones) && milestones.length > 0) {
      await Promise.all(milestones.map(async (m: any) => {
        let milestone;
        const milestoneData = {
          name: m.name,
          systemId: m.systemId,
          baselineDate: m.baselineDate,
          realDate: m.realDate,
          description: m.description,
          assignedEngineerId: m.assignedEngineerId,
          startDate: m.startDate,
          order: normalizeMilestoneOrder(m.order, 0),
          initiativeId: id,
        };

        if (m.id) {
          milestone = await prisma.initiativeMilestone.upsert({
            where: { id: m.id },
            update: milestoneData,
            create: {
              id: m.id,
              ...milestoneData,
            },
          });
        } else {
          milestone = await prisma.initiativeMilestone.create({
            data: milestoneData,
          });
        }

        if (Array.isArray(m.tasks)) {
          const persistedTaskIds = m.tasks.map((t: any) => t.id).filter(Boolean);

          await prisma.milestoneTask.deleteMany({
            where: {
              milestoneId: milestone.id,
              ...(persistedTaskIds.length > 0 ? { id: { notIn: persistedTaskIds } } : {})
            }
          });

          await Promise.all(m.tasks.map(async (t: any, taskIndex: number) => {
            const safeOrder = normalizeTaskOrder(t.order, taskIndex);
            const taskData = {
              name: t.name,
              status: t.status,
              type: t.type,
              assigneeId: t.assigneeId,
              startDate: t.startDate,
              systemId: t.systemId,
              systemIds: Array.isArray(t.systemIds) ? t.systemIds : [],
              priority: typeof t.priority === 'number' ? t.priority : null,
              targetDate: t.targetDate,
              notes: t.notes,
              taskHistory: Array.isArray(t.taskHistory) ? t.taskHistory : [],
              order: safeOrder,
              milestoneId: milestone.id,
            };

            if (t.id) {
              await prisma.milestoneTask.upsert({
                where: { id: t.id },
                update: taskData,
                create: {
                  id: t.id,
                  ...taskData,
                },
              });
            } else {
              await prisma.milestoneTask.create({
                data: taskData,
              });
            }
          }));
        }
      }));
    }

    if (Array.isArray(comments)) {
      await prisma.initiativeComment.deleteMany({ where: { initiativeId: id } });
      if (comments.length > 0) {
        await prisma.initiativeComment.createMany({
          data: comments.map((c: any) => ({
            content: c.content,
            userId: c.userId,
            userName: c.userName,
            userPhoto: c.userPhoto,
            timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
            initiativeId: id,
          }))
        });
      }
    }

    if (Array.isArray(history) && history.length > 0) {
      await prisma.initiativeHistory.createMany({
        data: history.map((h: any) => ({
          timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
          user: h.user,
          action: h.action,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          notes: h.notes,
          initiativeId: id,
        }))
      });
    }

    // Retorna a iniciativa atualizada com milestones e tasks
    const updated = await prisma.initiative.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { tasks: { orderBy: { order: 'asc' } } }
        },
        history: true,
        comments: true,
      },
    });

    invalidateCacheByPrefix('initiatives');
    res.json(updated);
  } catch (error: any) {
    console.error('API Error /api/initiatives/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update initiative', details: error.message });
  }
});

app.delete('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Manually delete related records if Cascade is not set/reliable at schema level. 
    await prisma.initiativeMilestone.deleteMany({ where: { initiativeId: id } });
    await prisma.initiativeHistory.deleteMany({ where: { initiativeId: id } });
    await prisma.allocation.deleteMany({ where: { initiativeId: id } });
    await prisma.initiative.delete({ where: { id } });
    invalidateCacheByPrefix('initiatives');
    res.json({ message: 'Initiative deleted' });
  } catch (error) {
    console.error('API Error /api/initiatives/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete initiative' });
  }
});

// --- Teams ---
app.get('/api/teams', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    const cacheKey = buildCacheKey('teams', where);
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const teams = await prisma.team.findMany({ where });
      console.log('Found', teams.length, 'teams', `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, teams);
      return teams;
    }, 'teams');
  } catch (error) {
    console.error('API Error /api/teams [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const data = sanitizeTeam(req.body);
    await ensureCompanyMatchesDept(data);

    const team = await prisma.team.create({ data: data as any });
    invalidateCacheByPrefix('teams');
    res.json(team);
  } catch (error: any) {
    console.error('API Error /api/teams [POST]:', error);
    res.status(500).json({ error: 'Failed to create team', details: error.message });
  }
});

app.patch('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeTeam(req.body);

    const team = await prisma.team.update({
      where: { id },
      data: data as any
    });
    invalidateCacheByPrefix('teams');
    res.json(team);
  } catch (error: any) {
    console.error('API Error /api/teams/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update team', details: error.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.team.delete({ where: { id } });
    invalidateCacheByPrefix('teams');
    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('API Error /api/teams/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// --- Collaborators ---
app.get('/api/collaborators', async (req, res) => {
  try {
    const lite = String(req.query.lite || 'false').toLowerCase() === 'true';
    const where = getCommonWhere(req);
    const cacheKey = buildCacheKey('collaborators', { ...where, lite });
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const collaborators = (await prisma.collaborator.findMany({
        where,
        select: lite ? collaboratorDashboardSelect : collaboratorSafeSelect
      })).map(c => ({
        ...c,
        role: (c.role === 'Engineer/Analyst' || c.role === 'ENGINEER/ANALYST') ? 'Engineer' : c.role
      })).map(c => transformCollaboratorImage(c as any));
      console.log('Found', collaborators.length, 'collaborators', `| dbQueryMs=${Date.now() - queryStart}`, `| lite=${lite}`);
      setCached(cacheKey, collaborators);
      return collaborators;
    }, `collaborators lite=${lite}`);
  } catch (error) {
    console.error('API Error /api/collaborators [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

app.post('/api/collaborators', async (req, res) => {
  try {
    const data = sanitizeCollaborator(req.body);
    await optimizeFieldInPlace(data, 'photoUrl', 'photo');

    const collaborator = await prisma.collaborator.create({ 
      data: data as any,
      include: {
        absences: true,
        skills: { include: { skill: true } }
      }
    });
    invalidateCacheByPrefix('collaborators');
    invalidateImageCacheByPrefix(`img:collaborator:${collaborator.id}`);
    res.json(collaborator);
  } catch (error: any) {
    console.error('API Error /api/collaborators [POST]:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um colaborador com este e-mail corporativo.' });
    }
    res.status(500).json({ error: 'Failed to create collaborator', details: error.message });
  }
});

app.patch('/api/collaborators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeCollaborator(req.body);
    await ensureCompanyMatchesDept(data);
    await optimizeFieldInPlace(data, 'photoUrl', 'photo');

    const collaborator = await prisma.collaborator.update({
      where: { id },
      data: data as any,
      include: {
        absences: true,
        skills: { include: { skill: true } }
      }
    });
    invalidateCacheByPrefix('collaborators');
    invalidateImageCacheByPrefix(`img:collaborator:${id}`);
    res.json(collaborator);
  } catch (error: any) {
    console.error('API Error /api/collaborators/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update collaborator', details: error.message });
  }
});

app.delete('/api/collaborators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const collaborator = await prisma.collaborator.findUnique({ where: { id } });
    if (!collaborator) return res.status(404).json({ error: 'Collaborator not found' });

    await prisma.collaborator.delete({ where: { id } });
    invalidateCacheByPrefix('collaborators');
    invalidateImageCacheByPrefix(`img:collaborator:${id}`);
    res.json({ message: 'Collaborator deleted' });
  } catch (error: any) {
    console.error('API Error /api/collaborators/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete collaborator', details: error.message });
  }
});

// --- Vendors ---
const VALID_VENDOR_FIELDS = new Set([
  'companyId', 'departmentId', 'companyName', 'taxId', 'type', 'logoUrl', 'directorId', 'managerId'
]);

function sanitizeVendor(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_VENDOR_FIELDS.has(key)) clean[key] = data[key];
  }
  stripImageRefFields(clean, ['logoUrl']);
  return clean;
}

const vendorLiteSelect = {
  id: true,
  companyId: true,
  departmentId: true,
  companyName: true,
  taxId: true,
  type: true,
  directorId: true,
  managerId: true
};

app.get('/api/vendors', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    const lite = req.query.lite === 'true';
    console.log('Fetching vendors with filter:', JSON.stringify(where));
    const queryStart = Date.now();
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { companyName: 'asc' },
      ...(lite ? { select: vendorLiteSelect } : {})
    });
    const queryMs = Date.now() - queryStart;
    console.log('Found', vendors.length, 'vendors', `| dbQueryMs=${queryMs}`);
    res.json(lite ? vendors : vendors.map(transformVendorImage));
  } catch (error: any) {
    console.error('API Error /api/vendors [GET]:', error?.message || error);
    if (error?.stack) console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch vendors', 
      details: error?.message,
      code: error?.code
    });
  }
});

app.get('/api/vendors-context', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    const companyWhere = where.companyId ? { id: where.companyId } : {};
    const deptWhere = where.companyId ? { companyId: where.companyId } : {};
    const cacheKey = buildCacheKey('vendors-context', where);
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const [vendors, contracts, systems, collaborators, companies, departments] = await Promise.all([
        prisma.vendor.findMany({
          where,
          include: { contracts: true, systems: { omit: systemListOmit } },
          orderBy: { companyName: 'asc' }
        }),
        prisma.contract.findMany({ where }),
        prisma.system.findMany({ where, omit: systemListOmit }),
        prisma.collaborator.findMany({ where, select: collaboratorSafeSelect }),
        prisma.company.findMany({ where: companyWhere, omit: companyListOmit }),
        prisma.department.findMany({ where: deptWhere })
      ]);
      const payload = {
        vendors: vendors.map(transformVendorImage),
        contracts,
        systems,
        collaborators: collaborators.map(transformCollaboratorImage),
        companies: companies.map(transformCompanyImage),
        departments
      };
      console.log('vendors-context built', `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, payload);
      return payload;
    }, 'vendors-context');
  } catch (error) {
    console.error('API Error /api/vendors-context [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch vendors context' });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    const data = sanitizeVendor(req.body);
    await ensureCompanyMatchesDept(data);
    await optimizeFieldInPlace(data, 'logoUrl', 'logo');
    const vendor = await prisma.vendor.create({ data: data as any });
    invalidateImageCacheByPrefix(`img:vendor:${vendor.id}`);
    res.json(vendor);
  } catch (error: any) {
    console.error('API Error /api/vendors [POST]:', error);
    res.status(500).json({ error: 'Failed to create vendor', details: error.message });
  }
});

app.patch('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeVendor(req.body);
    await ensureCompanyMatchesDept(data);
    await optimizeFieldInPlace(data, 'logoUrl', 'logo');
    const vendor = await prisma.vendor.update({
      where: { id },
      data: data as any
    });
    invalidateImageCacheByPrefix(`img:vendor:${id}`);
    res.json(vendor);
  } catch (error: any) {
    console.error('API Error /api/vendors/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update vendor', details: error.message });
  }
});

app.delete('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.vendor.delete({ where: { id } });
    invalidateImageCacheByPrefix(`img:vendor:${id}`);
    res.json({ message: 'Vendor deleted' });
  } catch (error: any) {
    console.error('API Error /api/vendors/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete vendor', details: error.message });
  }
});

// --- Contracts ---
const VALID_CONTRACT_FIELDS = new Set([
  'companyId', 'departmentId', 'vendorId', 'number', 'startDate', 'endDate', 'model', 'annualCost'
]);

function sanitizeContract(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_CONTRACT_FIELDS.has(key)) clean[key] = data[key];
  }
  return clean;
}

app.get('/api/contracts', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    console.log('Fetching contracts with filter:', JSON.stringify(where));
    const queryStart = Date.now();
    const contracts = await prisma.contract.findMany({
      where
    });
    const queryMs = Date.now() - queryStart;
    console.log('Found', contracts.length, 'contracts', `| dbQueryMs=${queryMs}`);
    res.json(contracts);
  } catch (error: any) {
    console.error('API Error /api/contracts [GET]:', error?.message || error);
    if (error?.stack) console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch contracts', 
      details: error?.message,
      code: error?.code
    });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const data = sanitizeContract(req.body);
    await ensureCompanyMatchesDept(data);
    const contract = await prisma.contract.create({ data: data as any });
    res.json(contract);
  } catch (error: any) {
    console.error('API Error /api/contracts [POST]:', error);
    res.status(500).json({ error: 'Failed to create contract', details: error.message });
  }
});

app.patch('/api/contracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeContract(req.body);
    await ensureCompanyMatchesDept(data);
    const contract = await prisma.contract.update({
      where: { id },
      data: data as any
    });
    res.json(contract);
  } catch (error: any) {
    console.error('API Error /api/contracts/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update contract', details: error.message });
  }
});

app.delete('/api/contracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.contract.delete({ where: { id } });
    res.json({ message: 'Contract deleted' });
  } catch (error: any) {
    console.error('API Error /api/contracts/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete contract', details: error.message });
  }
});

// --- Allocations ---
app.get('/api/allocations', async (_req, res) => {
  try {
    const allocations = await prisma.allocation.findMany();
    res.json(allocations);
  } catch (error) {
    console.error('API Error /api/allocations [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// --- Departments ---
app.get('/api/departments', async (_req, res) => {
  try {
    const cacheKey = buildCacheKey('departments');
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const departments = await prisma.department.findMany();
      console.log('Found', departments.length, 'departments', `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, departments);
      return departments;
    }, 'departments');
  } catch (error) {
    console.error('API Error /api/departments [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

app.patch('/api/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const department = await prisma.department.update({
      where: { id },
      data: req.body
    });
    res.json(department);
  } catch (error) {
    console.error('API Error /api/departments/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

app.post('/api/departments', async (req, res) => {
  const { masterUser, masterUserId, ...deptData } = req.body;
  try {
    const department = await prisma.$transaction(async (tx) => {
      const newDept = await tx.department.create({
        data: deptData
      });

      if (masterUserId) {
        // Assign existing collaborator as Master
        await tx.collaborator.update({
          where: { id: masterUserId },
          data: {
            role: 'Master',
            departmentId: newDept.id,
            companyId: deptData.companyId
          }
        });
      } else if (masterUser && masterUser.email && masterUser.name) {
        // Create new collaborator as Master
        await tx.collaborator.create({
          data: {
            name: masterUser.name,
            email: masterUser.email,
            password: masterUser.password || '123456',
            role: 'Master',
            companyId: deptData.companyId,
            departmentId: newDept.id,
            isAdmin: false,
            photoUrl: masterUser.photoUrl || ''
          }
        });
      }
      return newDept;
    });
    invalidateCacheByPrefix('departments');
    invalidateCacheByPrefix('collaborators');
    invalidateCacheByPrefix('teams');
    res.json(department);
  } catch (error: any) {
    console.error('API Error /api/departments [POST]:', error);
    res.status(500).json({ error: 'Failed to create department', details: error.message });
  }
});

app.patch('/api/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { masterUser, masterUserId, ...deptData } = req.body;
  try {
    const department = await prisma.$transaction(async (tx) => {
      // Remove id from deptData to avoid Prisma update errors
      const { id: _, ...updateData } = deptData;
      const updatedDept = await tx.department.update({
        where: { id },
        data: updateData
      });

      if (masterUserId) {
        // 1. Demote current masters
        await tx.collaborator.updateMany({
          where: { departmentId: id, role: 'Master' },
          data: { role: 'Operacional' }
        });

        // 2. Assign existing collaborator as Master
        await tx.collaborator.update({
          where: { id: masterUserId },
          data: {
            role: 'Master',
            departmentId: id,
            companyId: updatedDept.companyId
          }
        });
        
        // 3. Update department masterUserId
        await tx.department.update({
          where: { id },
          data: { masterUserId }
        });
      } else if (masterUser && masterUser.email && masterUser.name) {
        // 1. Demote current masters
        await tx.collaborator.updateMany({
          where: { departmentId: id, role: 'Master' },
          data: { role: 'Operacional' }
        });

        // 2. Create new collaborator as Master
        const newMaster = await tx.collaborator.create({
          data: {
            name: masterUser.name,
            email: masterUser.email,
            password: masterUser.password || '123456',
            role: 'Master',
            companyId: updatedDept.companyId,
            departmentId: id,
            isAdmin: false,
            photoUrl: masterUser.photoUrl || ''
          }
        });

        // 3. Update department masterUserId
        await tx.department.update({
          where: { id },
          data: { masterUserId: newMaster.id }
        });
      }
      return updatedDept;
    });
    invalidateCacheByPrefix('departments');
    invalidateCacheByPrefix('collaborators');
    invalidateCacheByPrefix('teams');
    res.json(department);
  } catch (error: any) {
    console.error('API Error /api/departments/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update department', details: error.message });
  }
});

// --- Companies ---
app.get('/api/companies', async (_req, res) => {
  try {
    const cacheKey = buildCacheKey('companies');
    await serveSWR(res, cacheKey, async () => {
      const queryStart = Date.now();
      const companies = (await prisma.company.findMany({ omit: companyListOmit })).map(transformCompanyImage);
      console.log('Found', companies.length, 'companies', `| dbQueryMs=${Date.now() - queryStart}`);
      setCached(cacheKey, companies);
      return companies;
    }, 'companies');
  } catch (error) {
    console.error('API Error /api/companies [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const body = stripImageRefFields({ ...req.body }, ['logo']);
    await optimizeFieldInPlace(body, 'logo', 'logo');
    const company = await prisma.company.create({
      data: body
    });
    invalidateImageCacheByPrefix(`img:company:${company.id}`);
    invalidateCacheByPrefix('companies');
    invalidateCacheByPrefix('departments');
    invalidateCacheByPrefix('teams');
    invalidateCacheByPrefix('collaborators');
    res.json(company);
  } catch (error) {
    console.error('API Error /api/companies [POST]:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.patch('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const body = stripImageRefFields({ ...req.body }, ['logo']);
    await optimizeFieldInPlace(body, 'logo', 'logo');
    const company = await prisma.company.update({
      where: { id },
      data: body
    });
    invalidateImageCacheByPrefix(`img:company:${id}`);
    invalidateCacheByPrefix('companies');
    invalidateCacheByPrefix('departments');
    invalidateCacheByPrefix('teams');
    invalidateCacheByPrefix('collaborators');
    res.json(company);
  } catch (error) {
    console.error('API Error /api/companies/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.company.delete({ where: { id } });
    invalidateImageCacheByPrefix(`img:company:${id}`);
    invalidateCacheByPrefix('companies');
    invalidateCacheByPrefix('departments');
    invalidateCacheByPrefix('teams');
    invalidateCacheByPrefix('collaborators');
    res.json({ message: 'Company deleted' });
  } catch (error) {
    console.error('API Error /api/companies/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// --- Skills API ---
app.get('/api/skills', async (req, res) => {
  const { companyId, departmentId } = req.query;
  try {
    const where: any = {};
    if (companyId) where.companyId = companyId as string;
    if (departmentId) where.departmentId = departmentId as string;

    const list = await prisma.skill.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        familia: true,
        icon: true,
        companyId: true,
        departmentId: true,
        collaborators: {
          select: {
            collaborator: {
              select: { id: true, name: true, photoUrl: true, role: true }
            }
          }
        }
      }
    });
    // Transform heavy data URLs into short ref URLs (skill icon + nested collaborator photos)
    const transformed = list.map(s => {
      const skill = transformSkillImage(s as any);
      if (Array.isArray(skill.collaborators)) {
        skill.collaborators = skill.collaborators.map((sc: any) => ({
          ...sc,
          collaborator: sc.collaborator ? transformCollaboratorImage(sc.collaborator) : sc.collaborator
        }));
      }
      return skill;
    });
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

app.post('/api/skills', async (req, res) => {
  const { memberIds, ...rest } = req.body;
  const skillData = stripImageRefFields({ ...rest }, ['icon']);
  await optimizeFieldInPlace(skillData, 'icon', 'icon');
  try {
    const skill = await prisma.$transaction(async (tx) => {
      const newSkill = await tx.skill.create({
        data: skillData
      });

      if (memberIds && Array.isArray(memberIds)) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map(cid => ({
            collaboratorId: cid,
            skillId: newSkill.id
          }))
        });
      }
      return newSkill;
    }, { timeout: 10000 });
    invalidateImageCacheByPrefix(`img:skill:${skill.id}`);
    res.json(skill);
  } catch (error: any) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill', details: error.message });
  }
});

app.patch('/api/skills/:id', async (req, res) => {
  const { id } = req.params;
  const { id: _, collaborators, memberIds, ...rest } = req.body;
  const updateData = stripImageRefFields({ ...rest }, ['icon']);
  await optimizeFieldInPlace(updateData, 'icon', 'icon');
  console.log(`PATCH /api/skills/${id} — memberIds:`, memberIds);
  try {
    const skill = await prisma.$transaction(async (tx) => {
      await tx.skill.update({
        where: { id },
        data: updateData
      });

      // Always sync collaborators (even empty array = remove all)
      await tx.collaboratorSkill.deleteMany({
        where: { skillId: id }
      });
      if (Array.isArray(memberIds) && memberIds.length > 0) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map((cid: string) => ({
            collaboratorId: cid,
            skillId: id
          }))
        });
      }

      // Return skill with collaborators populated
      return tx.skill.findUnique({
        where: { id },
        include: {
          collaborators: {
            include: {
              collaborator: { select: { id: true, name: true, photoUrl: true, role: true } }
            }
          }
        }
      });
    }, { timeout: 10000 });
    invalidateImageCacheByPrefix(`img:skill:${id}`);
    console.log(`PATCH /api/skills/${id} — saved collaborators:`, (skill as any)?.collaborators?.length);
    res.json(skill);
  } catch (error: any) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill', details: error.message });
  }
});

app.delete('/api/skills/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.collaboratorSkill.deleteMany({ where: { skillId: id } });
    await prisma.skill.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

app.post('/api/collaborators/skills/toggle', async (req, res) => {
  const { collaboratorId, skillId, active } = req.body;
  try {
    if (active) {
      await prisma.collaboratorSkill.upsert({
        where: { collaboratorId_skillId: { collaboratorId, skillId } },
        create: { collaboratorId, skillId },
        update: {}
      });
    } else {
      await prisma.collaboratorSkill.deleteMany({
        where: { collaboratorId, skillId }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle skill' });
  }
});

// --- Absences ---
app.get('/api/absences', async (req, res) => {
  const { companyId, departmentId, teamId } = req.query;
  try {
    const absences = await prisma.absence.findMany({
      where: {
        collaborator: {
          companyId: companyId as string,
          departmentId: departmentId as string,
          squadId: teamId ? (teamId as string) : undefined
        }
      },
      include: { collaborator: true }
    });
    res.json(absences);
  } catch (error) {
    console.error('API Error /api/absences [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

app.post('/api/absences', async (req, res) => {
  try {
    const absence = await prisma.absence.create({
      data: req.body,
      include: { collaborator: true }
    });
    res.json(absence);
  } catch (error) {
    console.error('API Error /api/absences [POST]:', error);
    res.status(500).json({ error: 'Failed to create absence' });
  }
});

app.delete('/api/absences/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.absence.delete({ where: { id } });
    res.json({ message: 'Absence deleted' });
  } catch (error) {
    console.error('API Error /api/absences/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete absence' });
  }
});

// --- Holidays ---
app.get('/api/holidays', async (req, res) => {
  const { companyId } = req.query;
  try {
    const holidays = await prisma.holiday.findMany({
      where: {
        OR: [
          { companyId: companyId as string },
          { companyId: null }
        ]
      }
    });
    res.json(holidays);
  } catch (error) {
    console.error('API Error /api/holidays [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

app.post('/api/holidays', async (req, res) => {
  try {
    const holiday = await prisma.holiday.create({
      data: req.body
    });
    res.json(holiday);
  } catch (error) {
    console.error('API Error /api/holidays [POST]:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

app.delete('/api/holidays/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.holiday.delete({ where: { id } });
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    console.error('API Error /api/holidays/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

// Global error handler — surfaces full stack in serverless logs (Vercel).
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[app.ts] Unhandled error:', err?.stack || err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error', detail: err?.message });
});

export default app;

