import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.collaborator.update({
    where: { email: 'niraldojunior@gmail.com' },
    data: { associatedCompanyIds: ['aff05c70-41b2-466b-85a8-e6a3bf3fbb11'] }
  });
  console.log('Updated user:', user.email, 'with associatedCompanyIds:', user.associatedCompanyIds);
}
run().catch(console.error).finally(() => prisma.$disconnect());
