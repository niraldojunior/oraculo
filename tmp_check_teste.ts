
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const inits = await prisma.initiative.findMany({
    where: { title: { contains: 'teste', mode: 'insensitive' } }
  });
  console.log('Found initiatives:', JSON.stringify(inits, null, 2));
  await prisma.$disconnect();
}

check();
