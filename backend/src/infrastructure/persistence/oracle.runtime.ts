type OracledbModule = {
  OUT_FORMAT_OBJECT?: number;
  outFormat?: number;
  CLOB?: unknown;
  fetchAsString?: unknown[];
  createPool: (config: {
    user: string;
    password: string;
    connectString: string;
    poolMin: number;
    poolMax: number;
    poolTimeout: number;
    poolPingInterval: number;
  }) => Promise<OraclePool>;
};

type OraclePoolConnection = {
  close: () => Promise<void>;
};

type OraclePool = {
  close: (drainTime?: number) => Promise<void>;
  getConnection: () => Promise<OracleConnection>;
};

type OracleConnection = OraclePoolConnection & {
  execute: (
    sql: string,
    binds?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<{ rows?: Array<Record<string, unknown>> }>;
};

export interface OracleRuntime {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  query: <T extends Record<string, unknown>>(sql: string, binds?: Record<string, unknown>) => Promise<T[]>;
  execute: (sql: string, binds?: Record<string, unknown>) => Promise<void>;
}

interface OracleRuntimeConfig {
  user: string;
  password: string;
  connectString: string;
  poolMin: number;
  poolMax: number;
  poolTimeout: number;
  poolPingInterval: number;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`[oracle] Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function readOracleRuntimeConfig(): OracleRuntimeConfig {
  return {
    user: readRequiredEnv('ORACLE_USER'),
    password: readRequiredEnv('ORACLE_PASSWORD'),
    connectString: readRequiredEnv('ORACLE_CONNECTION_STRING'),
    poolMin: Number(process.env.ORACLE_POOL_MIN || 1),
    poolMax: Number(process.env.ORACLE_POOL_MAX || 10),
    poolTimeout: Number(process.env.ORACLE_POOL_TIMEOUT_SECONDS || 60),
    poolPingInterval: Number(process.env.ORACLE_POOL_PING_INTERVAL_SECONDS || 60)
  };
}

async function loadOracleModule(): Promise<OracledbModule> {
  const mod = await import('oracledb');
  return (mod.default || mod) as OracledbModule;
}

export function createOracleRuntime(): OracleRuntime {
  const config = readOracleRuntimeConfig();
  let pool: OraclePool | null = null;

  return {
    start: async () => {
      const oracledb = await loadOracleModule();
      if (typeof oracledb.OUT_FORMAT_OBJECT === 'number') {
        oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
      }
      if (oracledb.CLOB) {
        oracledb.fetchAsString = [oracledb.CLOB];
      }

      console.log('[oracle] Creating Oracle pool...');
      pool = await oracledb.createPool({
        user: config.user,
        password: config.password,
        connectString: config.connectString,
        poolMin: config.poolMin,
        poolMax: config.poolMax,
        poolTimeout: config.poolTimeout,
        poolPingInterval: config.poolPingInterval
      });

      const conn = await pool.getConnection();
      try {
        await conn.execute('SELECT 1 FROM DUAL');
      } finally {
        await conn.close();
      }

      console.log('[oracle] Oracle connection successful');
      console.log(`[oracle] Pool settings: min=${config.poolMin} max=${config.poolMax}`);
    },

    stop: async () => {
      if (!pool) return;
      await pool.close(5);
      pool = null;
      console.log('[oracle] Oracle pool closed');
    },

    query: async <T extends Record<string, unknown>>(sql: string, binds: Record<string, unknown> = {}) => {
      if (!pool) {
        throw new Error('[oracle] Oracle pool is not initialized. Call start() first.');
      }

      const conn = await pool.getConnection();
      try {
        const result = await conn.execute(sql, binds, {});
        return (result.rows || []) as T[];
      } finally {
        await conn.close();
      }
    },

    execute: async (sql: string, binds: Record<string, unknown> = {}) => {
      if (!pool) {
        throw new Error('[oracle] Oracle pool is not initialized. Call start() first.');
      }

      const conn = await pool.getConnection();
      try {
        await conn.execute(sql, binds, { autoCommit: true });
      } finally {
        await conn.close();
      }
    }
  };
}