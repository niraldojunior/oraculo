import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const companies = await prisma.company.findMany();
  console.log(JSON.stringify(companies, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
