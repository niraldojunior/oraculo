import 'dotenv/config';
import oracledb from 'oracledb';

function cps(value) {
  return Array.from(String(value ?? '')).map((char) => char.codePointAt(0));
}

async function main() {
  const initiativeId = process.argv[2] || '4283e616-fd7c-44f7-b868-8669a760b1d6';
  const updatedName = 'Módulo Admin';

  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
  });

  try {
    const row = await conn.execute(
      `
        SELECT "id", "name"
        FROM "InitiativeMilestone"
        WHERE "initiativeId" = :id
        ORDER BY "order" ASC
        FETCH FIRST 1 ROWS ONLY
      `,
      { id: initiativeId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const milestone = row.rows?.[0];
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    const milestoneId = milestone.id ?? milestone.ID;

    await conn.execute(
      'UPDATE "InitiativeMilestone" SET "name" = :name WHERE "id" = :id',
      { name: updatedName, id: milestoneId },
      { autoCommit: true }
    );

    const check = await conn.execute(
      'SELECT "name" FROM "InitiativeMilestone" WHERE "id" = :id',
      { id: milestoneId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const stored = check.rows?.[0]?.name ?? check.rows?.[0]?.NAME;
    console.log('STORED:', stored);
    console.log('CP:', cps(stored).join(','));
  } finally {
    await conn.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
