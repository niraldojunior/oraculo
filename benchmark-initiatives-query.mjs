import { Pool } from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';

// Load local env first, then fallback to .env
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const RUNS = Number(process.env.BENCH_RUNS || 10);

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local or .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log(`Running benchmark: SELECT * FROM "Initiative" (${RUNS}x)`);

  const times = [];
  const rowsPerRun = [];

  for (let i = 1; i <= RUNS; i++) {
    const start = process.hrtime.bigint();

    try {
      const result = await pool.query('SELECT "public"."Collaborator"."id", "public"."Collaborator"."companyId", "public"."Collaborator"."departmentId", "public"."Collaborator"."name", "public"."Collaborator"."email", "public"."Collaborator"."role", "public"."Collaborator"."teamId", "public"."Collaborator"."phone", "public"."Collaborator"."bio", "public"."Collaborator"."linkedinUrl", "public"."Collaborator"."githubUrl", "public"."Collaborator"."isAdmin", "public"."Collaborator"."associatedCompanyIds", "public"."Collaborator"."vacationStart", "public"."Collaborator"."startDate", "public"."Collaborator"."endDate" FROM "public"."Collaborator" WHERE ("public"."Collaborator"."companyId" = \'c_vtal\' AND "public"."Collaborator"."departmentId" = \'d_core\');');
      const end = process.hrtime.bigint();
      const elapsedMs = Number(end - start) / 1_000_000;
      times.push(elapsedMs);
      rowsPerRun.push(result.rowCount ?? 0);

      console.log(
        `[${i}/${RUNS}] rows=${result.rowCount ?? 0} durationMs=${elapsedMs.toFixed(2)}`
      );
    } catch (error) {
      const end = process.hrtime.bigint();
      const elapsedMs = Number(end - start) / 1_000_000;
      console.error(`[${i}/${RUNS}] FAILED durationMs=${elapsedMs.toFixed(2)}`, error.message);
      throw error;
    }
  }

  const sum = times.reduce((acc, v) => acc + v, 0);
  const avg = sum / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const totalRows = rowsPerRun.reduce((acc, v) => acc + v, 0);
  const avgRows = totalRows / rowsPerRun.length;
  const minRows = Math.min(...rowsPerRun);
  const maxRows = Math.max(...rowsPerRun);

  console.log('--- Summary ---');
  console.log(`runs=${times.length}`);
  console.log(`avgMs=${avg.toFixed(2)}`);
  console.log(`minMs=${min.toFixed(2)}`);
  console.log(`maxMs=${max.toFixed(2)}`);
  console.log(`avgRows=${avgRows.toFixed(2)}`);
  console.log(`minRows=${minRows}`);
  console.log(`maxRows=${maxRows}`);
}

main()
  .catch((err) => {
    console.error('Benchmark failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
