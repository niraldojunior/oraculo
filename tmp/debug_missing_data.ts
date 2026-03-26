
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Collaborators ---');
  const collabs = await prisma.collaborator.findMany({
    where: { name: { contains: 'Debora', mode: 'insensitive' } }
  });
  console.log(JSON.stringify(collabs, null, 2));

  console.log('\n--- Teams ---');
  const teams = await prisma.team.findMany({
    where: { 
      OR: [
        { name: { contains: 'Integrações', mode: 'insensitive' } },
        { name: { contains: 'Dados', mode: 'insensitive' } },
        { name: { contains: 'Telecom', mode: 'insensitive' } }
      ]
    }
  });
  console.log(JSON.stringify(teams, null, 2));

  console.log('\n--- All Teams Count ---');
  const count = await prisma.team.count();
  console.log('Total teams:', count);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
