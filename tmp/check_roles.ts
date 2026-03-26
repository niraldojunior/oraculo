
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Roles in Collaborator Table ---');
  const roles = await prisma.collaborator.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  console.log(JSON.stringify(roles, null, 2));

  console.log('\n--- Roles in User Table ---');
  const userRoles = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  console.log(JSON.stringify(userRoles, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
