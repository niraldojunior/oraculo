import { PrismaClient } from '@prisma/client';

export interface PrismaRuntimeConfig {
  isServerless: boolean;
  poolMinConnections: number;
  poolTimeoutSeconds: number;
  poolKeepAliveMs: number;
  queryLogEnabled: boolean;
  queryLogParams: boolean;
}

function readPrismaRuntimeConfig(): PrismaRuntimeConfig {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

  return {
    isServerless,
    poolMinConnections: Number(process.env.PRISMA_POOL_MIN_CONNECTIONS || (isServerless ? 1 : 10)),
    poolTimeoutSeconds: Number(process.env.PRISMA_POOL_TIMEOUT_SECONDS || (isServerless ? 10 : 20)),
    poolKeepAliveMs: Number(process.env.PRISMA_POOL_KEEPALIVE_MS || 60000),
    queryLogEnabled: (process.env.PRISMA_QUERY_LOG_ENABLED || 'true').toLowerCase() !== 'false',
    queryLogParams: (process.env.PRISMA_QUERY_LOG_PARAMS || 'true').toLowerCase() !== 'false'
  };
}

function withPrismaPoolTuning(databaseUrl: string | undefined, config: PrismaRuntimeConfig) {
  if (!databaseUrl) return undefined;
  try {
    const url = new URL(databaseUrl);
    const rawLimit = url.searchParams.get('connection_limit');
    const parsedLimit = rawLimit ? Number(rawLimit) : NaN;

    if (config.isServerless) {
      url.searchParams.set('connection_limit', String(config.poolMinConnections));
    } else if (!Number.isFinite(parsedLimit) || parsedLimit < config.poolMinConnections) {
      url.searchParams.set('connection_limit', String(config.poolMinConnections));
    }

    url.searchParams.set('pool_timeout', String(config.poolTimeoutSeconds));

    return url.toString();
  } catch {
    console.warn('[app.ts] DATABASE_URL is not a valid URL, skipping pool tuning');
    return databaseUrl;
  }
}

function attachQueryLogging(prisma: PrismaClient, config: PrismaRuntimeConfig) {
  if (!config.queryLogEnabled) return;

  console.log(`[app.ts] Prisma query logging enabled (params=${config.queryLogParams})`);
  const noisySql = /^(BEGIN|COMMIT|ROLLBACK|DEALLOCATE|SELECT 1)\b/i;
  (prisma as any).$on('query', (event: any) => {
    if (noisySql.test(String(event.query).trim())) return;
    const params = config.queryLogParams ? ` | params=${event.params}` : '';
    console.log(`[db.query] ${event.duration}ms | target=${event.target} | sql=${event.query}${params}`);
  });
}

async function repairNullMilestoneTaskOrders(prisma: PrismaClient) {
  try {
    const repaired = await prisma.$executeRawUnsafe('UPDATE "MilestoneTask" SET "order" = 0 WHERE "order" IS NULL');
    if (repaired > 0) {
      console.log(`[app.ts] Repaired ${repaired} milestone task records with null order`);
    }
  } catch (error) {
    console.warn('[app.ts] Milestone task order repair skipped:', error);
  }
}

async function repairNullInitiativeMilestoneOrders(prisma: PrismaClient) {
  try {
    const repaired = await prisma.$executeRawUnsafe('UPDATE "InitiativeMilestone" SET "order" = 0 WHERE "order" IS NULL');
    if (repaired > 0) {
      console.log(`[app.ts] Repaired ${repaired} initiative milestone records with null order`);
    }
  } catch (error) {
    console.warn('[app.ts] Initiative milestone order repair skipped:', error);
  }
}

export function createPrismaRuntime() {
  const config = readPrismaRuntimeConfig();
  const tunedDatabaseUrl = withPrismaPoolTuning(process.env.DATABASE_URL, config);

  const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
    ...(tunedDatabaseUrl
      ? {
          datasources: {
            db: { url: tunedDatabaseUrl }
          }
        }
      : {}),
    ...(config.queryLogEnabled
      ? {
          log: [{ emit: 'event', level: 'query' }]
        }
      : {})
  };

  console.log('[app.ts] Creating Prisma client...');
  const prisma = new PrismaClient(prismaClientOptions);
  console.log('[app.ts] Prisma client created');
  if (tunedDatabaseUrl) {
    console.log(`[app.ts] Prisma pool tuned: connection_limit>=${config.poolMinConnections}`);
  }

  attachQueryLogging(prisma, config);

  return {
    prisma,
    config
  };
}

export async function startPrismaRuntime(prisma: PrismaClient, config: PrismaRuntimeConfig) {
  if (config.isServerless) return;

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');

    await Promise.all(
      Array.from({ length: config.poolMinConnections }, () => prisma.$queryRaw`SELECT 1`)
    );
    console.log(`✓ Prisma pool pre-warmed with up to ${config.poolMinConnections} concurrent pings`);

    const keepAliveTimer = setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        console.warn('[app.ts] Prisma pool keepalive failed:', error);
      }
    }, config.poolKeepAliveMs);
    keepAliveTimer.unref();

    await repairNullInitiativeMilestoneOrders(prisma);
    await repairNullMilestoneTaskOrders(prisma);
  } catch (error) {
    console.error('✗ Database connection failed:', error);
  }
}
