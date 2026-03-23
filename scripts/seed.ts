import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { mockSystems } from '../src/data/mockDb.js';
import { importedInitiatives } from '../src/data/importedInitiatives.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with batch inserts...');
  
  // Create teams and collaborators
  await prisma.team.createMany({
    data: [
      { id: 'team_1', name: 'Default Team', type: 'Tribe' }
    ],
    skipDuplicates: true
  });

  await prisma.collaborator.createMany({
    data: [
      { id: 'c_ger_nm', name: 'Default Leader', email: 'leader@oraculo.com', role: 'Manager', teamId: 'team_1' },
      { id: 'tech_lead_1', name: 'Tech Lead', email: 'tech@oraculo.com', role: 'Tech Lead', teamId: 'team_1' }
    ],
    skipDuplicates: true
  });

  console.log('Batch creating systems...');
  const systemData = mockSystems.map(sys => ({
    id: sys.id,
    name: sys.name,
    domain: sys.domain,
    subDomain: sys.subDomain,
    criticality: sys.criticality,
    techStack: sys.techStack,
    ownerTeamId: 'team_1',
    smeId: 'tech_lead_1',
    lifecycleStatus: sys.lifecycleStatus,
    debtScore: sys.debtScore,
    description: sys.description || '',
    platformCategory: sys.platformCategory
  }));

  await prisma.system.createMany({
    data: systemData,
    skipDuplicates: true
  });

  console.log('Batch creating initiatives...');
  const iniData = importedInitiatives.filter(i => i.id).map(ini => ({
    id: ini.id,
    title: ini.title,
    type: ini.type,
    benefit: ini.benefit,
    benefitType: ini.benefitType,
    scope: ini.scope,
    customerOwner: ini.customerOwner,
    originDirectorate: ini.originDirectorate,
    leaderId: 'c_ger_nm',
    status: ini.status
  }));

  await prisma.initiative.createMany({
    data: iniData,
    skipDuplicates: true
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
