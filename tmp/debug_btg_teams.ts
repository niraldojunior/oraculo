
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ALL TEAMS for BTG Pactual (c_btg) ---');
  const teams = await prisma.team.findMany({ where: { companyId: 'c_btg' } });
  teams.forEach(t => console.log(`${t.id}: ${t.name} (Dept: ${t.departmentId})`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
