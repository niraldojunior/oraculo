import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    const initiativeCount = await prisma.initiative.count();
    console.log('Initiative count:', initiativeCount);

    console.log('Testing systems fetch...');
    const systems = await prisma.system.findMany({ take: 1 });
    console.log('Systems fetch success:', systems.length);
  } catch (error) {
    console.error('FULL ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
