import { config } from 'dotenv';

config({ path: '.env.test.local' });

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[integration-tests] DATABASE_URL não configurado. Crie .env.test.local apontando para um Postgres local dedicado a testes ' +
      '(ver docs/02-system-design/architecture.md §7).'
  );
}
