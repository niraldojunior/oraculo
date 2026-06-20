import 'dotenv/config';
import { Client } from 'pg';
import oracledb from 'oracledb';

function codePoints(value) {
  return Array.from(String(value ?? '')).map((char) => char.codePointAt(0));
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_DATABASE_URL or DATABASE_URL');
  }

  const pg = new Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  const oracle = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
  });

  try {
    const initiativeId = process.argv[2] || '4283e616-fd7c-44f7-b868-8669a760b1d6';

    const pgRows = await pg.query(
      'SELECT "name" FROM "InitiativeMilestone" WHERE "initiativeId" = $1 ORDER BY "order"',
      [initiativeId]
    );

    console.log('SUPABASE:');
    for (const row of pgRows.rows) {
      console.log(`- ${row.name}`);
      console.log(`  cp: ${codePoints(row.name).join(',')}`);
    }

    const oracleRows = await oracle.execute(
      'SELECT "name" FROM "InitiativeMilestone" WHERE "initiativeId" = :id ORDER BY "order"',
      { id: initiativeId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('\nORACLE:');
    for (const row of oracleRows.rows ?? []) {
      const name = row.name ?? row.NAME;
      console.log(`- ${name}`);
      console.log(`  cp: ${codePoints(name).join(',')}`);
    }

    const nls = await oracle.execute(
      `
        SELECT parameter, value
        FROM nls_database_parameters
        WHERE parameter IN ('NLS_CHARACTERSET', 'NLS_NCHAR_CHARACTERSET')
        ORDER BY parameter
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('\nORACLE NLS:');
    for (const row of nls.rows ?? []) {
      console.log(`- ${(row.parameter ?? row.PARAMETER)} = ${(row.value ?? row.VALUE)}`);
    }
  } finally {
    await pg.end();
    await oracle.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
