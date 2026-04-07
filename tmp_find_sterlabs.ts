import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const sterlabs = await prisma.company.findFirst({
    where: { fantasyName: { contains: 'Sterlabs', mode: 'insensitive' } }
  });
  if (sterlabs) {
    console.log('STERLABS_ID:' + sterlabs.id);
  } else {
    console.log('STERLABS NOT FOUND');
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
