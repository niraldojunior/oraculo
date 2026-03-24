import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database and seeding core admin data...');

  const COMPANY_ID = 'c_vtal';

  // 1. Company
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {},
    create: {
      id: COMPANY_ID,
      fantasyName: 'V.tal',
      realName: 'V.tal Rede Neutra S.A.',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/V.tal_Logo.png/800px-V.tal_Logo.png',
      description: 'Empresa de rede neutra de fibra óptica.'
    }
  });

  // 2. User (Admin)
  await prisma.user.upsert({
    where: { email: 'niraldojunior@gmail.com' },
    update: {
      id: 'u_niraldo',
      fullName: 'Niraldo Rocha Granado Junior',
      role: 'Director',
      associatedCompanyIds: [COMPANY_ID]
    },
    create: {
      id: 'u_niraldo',
      fullName: 'Niraldo Rocha Granado Junior',
      email: 'niraldojunior@gmail.com',
      password: '123',
      role: 'Director',
      associatedCompanyIds: [COMPANY_ID]
    }
  });

  console.log('Base cleaned! Only V.tal and Admin user remaining.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
