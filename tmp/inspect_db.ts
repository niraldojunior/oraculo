import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Users ---');
  const users = await prisma.user.findMany();
  users.forEach(u => {
    console.log(`User: [${u.email}] Password: [${u.password}]`);
  });

  console.log('--- Checking Collaborators ---');
  const collabs = await prisma.collaborator.findMany();
  collabs.forEach(c => {
    console.log(`Collab: [${c.email}] Password: [${c.password}]`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
