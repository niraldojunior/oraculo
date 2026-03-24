import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database and seeding core admin data...');

  const COMPANY_ID = 'c_vtal';
  const DEPT_ID = 'd_core';

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

  // 2. Department
  await prisma.department.upsert({
    where: { id: DEPT_ID },
    update: { name: 'Engenharia e Operações' },
    create: {
      id: DEPT_ID,
      name: 'Engenharia e Operações',
      companyId: COMPANY_ID
    }
  });

  // 3. User (Admin)
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

  // 4. Vendors
  const vendors = [
    { id: 'v_vtal', name: 'V.tal', taxId: '00.000.000/0001-00', type: 'Software House' },
    { id: 'v_oracle', name: 'Oracle', taxId: '12.345.678/0001-90', type: 'Software House' },
    { id: 'v_openlabs', name: 'Openlabs', taxId: '11.111.111/0001-11', type: 'Software House' },
    { id: 'v_salesforce', name: 'Salesforce', taxId: '44.444.444/0001-44', type: 'Software House' },
  ];

  for (const v of vendors) {
    await prisma.vendor.upsert({
      where: { id: v.id },
      update: { companyName: v.name },
      create: {
        id: v.id,
        companyId: COMPANY_ID,
        departmentId: DEPT_ID,
        companyName: v.name,
        taxId: v.taxId,
        type: v.type
      }
    });
  }

  // 5. Teams
  const teams = [
    { id: 't_oss', name: 'OSS Core', type: 'Gerencia' },
    { id: 't_bss', name: 'BSS Digital', type: 'Gerencia' },
  ];

  for (const t of teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: {
        id: t.id,
        companyId: COMPANY_ID,
        departmentId: DEPT_ID,
        name: t.name,
        type: t.type
      }
    });
  }

  // 6. Systems
  const systems = [
    { id: 's_pega', name: 'Pega Tecto', domain: 'Workforce Management', criticality: 'Tier 1' },
    { id: 's_netwin', name: 'Netwin', domain: 'Network Management', criticality: 'Tier 1' },
    { id: 's_som', name: 'Oracle SOM', domain: 'Fulfillment & Assurance', criticality: 'Tier 1' },
  ];

  for (const s of systems) {
    await prisma.system.upsert({
      where: { id: s.id },
      update: { name: s.name },
      create: {
        id: s.id,
        companyId: COMPANY_ID,
        departmentId: DEPT_ID,
        name: s.name,
        domain: s.domain,
        criticality: s.criticality,
        description: `Sistema de ${s.domain}`,
        lifecycleStatus: 'Ativo Greenfield'
      }
    });
  }

  console.log('Seed completed successfully with Department and core data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
