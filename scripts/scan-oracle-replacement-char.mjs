import 'dotenv/config';
import oracledb from 'oracledb';

const checks = [
  { table: 'Initiative', column: 'title' },
  { table: 'Initiative', column: 'benefit' },
  { table: 'Initiative', column: 'scope' },
  { table: 'Initiative', column: 'rationale' },
  { table: 'InitiativeMilestone', column: 'name' },
  { table: 'InitiativeMilestone', column: 'description' },
  { table: 'MilestoneTask', column: 'name' },
  { table: 'MilestoneTask', column: 'notes' },
  { table: 'InitiativeHistory', column: 'action' },
  { table: 'InitiativeHistory', column: 'notes' },
  { table: 'InitiativeComment', column: 'userName' },
  { table: 'InitiativeComment', column: 'content' },
  { table: 'Company', column: 'name' },
  { table: 'Department', column: 'name' },
  { table: 'System', column: 'name' },
  { table: 'Team', column: 'name' },
  { table: 'Vendor', column: 'name' },
  { table: 'Contract', column: 'name' },
  { table: 'Collaborator', column: 'name' }
];

async function main() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
  });

  try {
    for (const item of checks) {
      const sql = `
        SELECT COUNT(*) AS CNT
        FROM "${item.table}"
        WHERE INSTR("${item.column}", UNISTR('\\FFFD')) > 0
      `;

      try {
        const result = await conn.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const count = Number((result.rows?.[0]?.CNT ?? result.rows?.[0]?.cnt) || 0);

        if (count > 0) {
          console.log(`${item.table}.${item.column}: ${count}`);
        }
      } catch (error) {
        console.log(`${item.table}.${item.column}: skipped (${error.code || error.message})`);
      }
    }
  } finally {
    await conn.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
