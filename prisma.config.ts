import { defineConfig } from 'prisma/config';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

export default defineConfig({
  schema: 'backend/src/infrastructure/persistence/prisma/schema.prisma'
});
