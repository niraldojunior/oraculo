import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  users.forEach(u => console.log(`U[${u.email}]`));
  const collabs = await prisma.collaborator.findMany();
  collabs.forEach(c => console.log(`C[${c.email}]`));
  await prisma.$disconnect();
}
main();
