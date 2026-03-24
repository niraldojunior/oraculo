import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
  const initiatives = await prisma.initiative.findMany();
  console.log('--- ALL INITIATIVES ---');
  initiatives.forEach(i => {
    console.log(`ID: ${i.id}, Title: ${i.title}, Status: ${i.status}`);
  });
  console.log('--- TOTAL: ', initiatives.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
