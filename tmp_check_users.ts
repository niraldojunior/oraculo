import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.collaborator.findMany({
    where: {
      email: {
        in: ['niraldo.junior@vtal.com', 'niraldojunior@gmail.com']
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isAdmin: true,
      companyId: true,
      departmentId: true,
      associatedCompanyIds: true
    }
  });

  fs.writeFileSync('tmp_users_data.json', JSON.stringify(users, null, 2));
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
