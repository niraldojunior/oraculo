import { Injectable, OnModuleDestroy } from '@nestjs/common';

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

type OraclePool = {
  close: (drainTime?: number) => Promise<void>;
  getConnection: () => Promise<OracleConnection>;
};

type OracleConnection = {
  execute: (
    sql: string,
    binds?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<{ rows?: Array<Record<string, unknown>> }>;
  close: () => Promise<void>;
};

@Injectable()
export class OracleService implements OnModuleDestroy {
  private pool: OraclePool | null = null;

  async onModuleDestroy(): Promise<void> {
    if (!this.pool) return;
    await this.pool.close(5);
    this.pool = null;
  }

  query<T extends Record<string, unknown>>(sql: string, binds?: Record<string, unknown>): Promise<T[]> {
    return this.withConnection(async connection => {
      const result = await connection.execute(sql, binds ?? {}, {});
      return (result.rows ?? []) as T[];
    });
  }

  async execute(sql: string, binds?: Record<string, unknown>): Promise<void> {
    await this.withConnection(async connection => {
      await connection.execute(sql, binds ?? {}, { autoCommit: true });
    });
  }

  private async withConnection<T>(fn: (connection: OracleConnection) => Promise<T>): Promise<T> {
    await this.ensurePool();

    if (!this.pool) {
      throw new Error('[oracle] pool is not initialized');
    }
    const connection = await this.pool.getConnection();
    try {
      return await fn(connection);
    } finally {
      await connection.close();
    }
  }

  private requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value || !value.trim()) {
      throw new Error(`[oracle] Missing required environment variable: ${name}`);
    }
    return value.trim();
  }

  private async loadOracleModule(): Promise<OracledbModule> {
    const mod = await import('oracledb');
    return (mod.default || mod) as OracledbModule;
  }

  private async ensurePool(): Promise<void> {
    if (this.pool) return;

    const oracledb = await this.loadOracleModule();
    if (typeof oracledb.OUT_FORMAT_OBJECT === 'number') {
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    }
    if (oracledb.CLOB) {
      oracledb.fetchAsString = [oracledb.CLOB];
    }

    this.pool = await oracledb.createPool({
      user: this.requiredEnv('ORACLE_USER'),
      password: this.requiredEnv('ORACLE_PASSWORD'),
      connectString: this.requiredEnv('ORACLE_CONNECTION_STRING'),
      poolMin: Number(process.env.ORACLE_POOL_MIN || 1),
      poolMax: Number(process.env.ORACLE_POOL_MAX || 10),
      poolTimeout: Number(process.env.ORACLE_POOL_TIMEOUT_SECONDS || 60),
      poolPingInterval: Number(process.env.ORACLE_POOL_PING_INTERVAL_SECONDS || 60)
    });
  }
}
