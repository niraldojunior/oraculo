import 'dotenv/config';
import { Client as PgClient } from 'pg';
import oracledb from 'oracledb';

type TablePlan = {
  table: string;
  pk?: string[];
};

type OracleColumnMeta = {
  name: string;
  nullable: boolean;
  dataType: string;
  dataDefault: string | null;
};

const plan: TablePlan[] = [
  { table: 'Company', pk: ['id'] },
  { table: 'Department', pk: ['id'] },
  { table: 'Collaborator', pk: ['id'] },
  { table: 'Holiday', pk: ['id'] },
  { table: 'Skill', pk: ['id'] },
  { table: 'Team', pk: ['id'] },
  { table: 'System', pk: ['id'] },
  { table: 'Vendor', pk: ['id'] },
  { table: 'Initiative', pk: ['id'] },
  { table: 'Contract', pk: ['id'] },
  { table: 'Allocation', pk: ['id'] },
  { table: 'InitiativeMilestone', pk: ['id'] },
  { table: 'MilestoneTask', pk: ['id'] },
  { table: 'InitiativeHistory', pk: ['id'] },
  { table: 'InitiativeComment', pk: ['id'] },
  { table: 'CollaboratorSkill', pk: ['collaboratorId', 'skillId'] },
  { table: 'Absence', pk: ['id'] }
];

const reverseDeleteOrder = [...plan].reverse();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toOracleValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value instanceof Date) return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function fromOracleDefault(meta: OracleColumnMeta): unknown {
  const raw = (meta.dataDefault || '').trim();
  if (raw.length === 0) return undefined;

  if (raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1);
  }

  const num = Number(raw);
  if (!Number.isNaN(num)) return num;

  if (raw.includes('CURRENT_TIMESTAMP') || raw.includes('SYSTIMESTAMP') || raw.includes('SYSDATE')) {
    return new Date();
  }

  return undefined;
}

function requiredFallback(meta: OracleColumnMeta): unknown {
  const fromDefault = fromOracleDefault(meta);
  if (fromDefault !== undefined) return fromDefault;

  if (meta.dataType.includes('NUMBER')) return 0;
  if (meta.dataType.includes('TIMESTAMP') || meta.dataType === 'DATE') return new Date();
  if (meta.dataType.includes('CLOB')) return ' ';
  return ' ';
}

function orderByClause(pk?: string[]): string {
  if (!pk || pk.length === 0) return '';
  const cols = pk.map(c => `"${c}"`).join(', ');
  return ` ORDER BY ${cols}`;
}

async function getPgCount(pg: PgClient, table: string): Promise<number> {
  const result = await pg.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
  return Number(result.rows[0]?.count ?? 0);
}

async function getOracleCount(conn: oracledb.Connection, table: string): Promise<number> {
  const result = await conn.execute<{ COUNT: number }>(
    `SELECT COUNT(*) AS COUNT FROM "${table}"`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const row = result.rows?.[0];
  return Number(row?.COUNT ?? 0);
}

async function clearOracleTable(conn: oracledb.Connection, table: string): Promise<void> {
  await conn.execute(`DELETE FROM "${table}"`);
}

async function getOracleColumnsMeta(conn: oracledb.Connection, table: string): Promise<Map<string, OracleColumnMeta>> {
  const result = await conn.execute<{
    COLUMN_NAME: string;
    NULLABLE: 'Y' | 'N';
    DATA_TYPE: string;
    DATA_DEFAULT: string | null;
  }>(
    `
      SELECT column_name, nullable, data_type, data_default
      FROM user_tab_columns
      WHERE table_name = :tableName
    `,
    { tableName: table },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  const map = new Map<string, OracleColumnMeta>();
  for (const row of result.rows ?? []) {
    map.set(String(row.COLUMN_NAME).toLowerCase(), {
      name: row.COLUMN_NAME,
      nullable: row.NULLABLE === 'Y',
      dataType: row.DATA_TYPE,
      dataDefault: row.DATA_DEFAULT
    });
  }

  return map;
}

async function copyTable(pg: PgClient, conn: oracledb.Connection, item: TablePlan): Promise<void> {
  const table = item.table;
  const oracleMeta = await getOracleColumnsMeta(conn, table);
  const selectSql = `SELECT * FROM "${table}"${orderByClause(item.pk)}`;
  const source = await pg.query(selectSql);
  const rows = source.rows;

  if (rows.length === 0) {
    console.log(`[copy] ${table}: source is empty`);
    return;
  }

  const sourceColumns = Object.keys(rows[0]).filter(c => oracleMeta.has(c.toLowerCase()));
  const requiredMissing = Array.from(oracleMeta.values())
    .filter(m => !m.nullable && !sourceColumns.some(c => c.toLowerCase() === m.name.toLowerCase()))
    .map(m => m.name);

  const columns = [...sourceColumns, ...requiredMissing];
  const columnSql = columns.map(c => `"${c}"`).join(', ');
  const bindSql = columns.map((_, idx) => `:${idx + 1}`).join(', ');
  const insertSql = `INSERT INTO "${table}" (${columnSql}) VALUES (${bindSql})`;

  const binds = rows.map(row =>
    columns.map(col => {
      const raw = (row as Record<string, unknown>)[col];
      const mapped = toOracleValue(raw);
      const meta = oracleMeta.get(col.toLowerCase());

      if ((mapped === null || mapped === undefined || mapped === '') && meta && !meta.nullable) {
        return requiredFallback(meta);
      }

      return mapped;
    })
  );

  await conn.executeMany(insertSql, binds, {
    autoCommit: false,
    batchErrors: false
  });

  console.log(`[copy] ${table}: ${rows.length} rows inserted`);
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_DATABASE_URL or DATABASE_URL');
  }

  const pg = new PgClient({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
  const oracle = await oracledb.getConnection({
    user: requireEnv('ORACLE_USER'),
    password: requireEnv('ORACLE_PASSWORD'),
    connectString: requireEnv('ORACLE_CONNECTION_STRING')
  });

  try {
    await pg.connect();

    console.log('Connected to Supabase and Oracle');

    for (const item of reverseDeleteOrder) {
      await clearOracleTable(oracle, item.table);
      console.log(`[clear] ${item.table}`);
    }
    await oracle.commit();

    for (const item of plan) {
      await copyTable(pg, oracle, item);
      await oracle.commit();
    }

    console.log('\nVerification (source -> target):');
    let mismatch = 0;
    for (const item of plan) {
      const src = await getPgCount(pg, item.table);
      const dst = await getOracleCount(oracle, item.table);
      const ok = src === dst;
      if (!ok) mismatch += 1;
      console.log(`- ${item.table}: ${src} -> ${dst}${ok ? '' : ' [MISMATCH]'}`);
    }

    if (mismatch > 0) {
      throw new Error(`Migration finished with ${mismatch} count mismatches.`);
    }

    console.log('\nMigration completed successfully with full count parity.');
  } finally {
    await pg.end();
    await oracle.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
