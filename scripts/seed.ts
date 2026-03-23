import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { mockSystems } from '../src/data/mockDb.js';
import { importedInitiatives } from '../src/data/importedInitiatives.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with batch inserts...');
  
  // 1. Create Teams
  console.log('Creating teams...');
  const { mockTeams, mockCollaborators, mockSystems, mockInitiatives } = await import('../src/data/mockDb.js');
  
  await prisma.team.createMany({
    data: mockTeams.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      parentTeamId: t.parentTeamId,
      leaderId: t.leaderId
    })),
    skipDuplicates: true
  });

  // 2. Create Collaborators
  console.log('Creating collaborators...');
  await prisma.collaborator.createMany({
    data: mockCollaborators.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      teamId: c.teamId,
      photoUrl: c.photoUrl,
      phone: c.phone,
      bio: c.bio
    })),
    skipDuplicates: true
  });

  // 3. Create Systems
  console.log('Creating systems...');
  await prisma.system.createMany({
    data: mockSystems.map(sys => ({
      id: sys.id,
      name: sys.name,
      domain: sys.domain,
      subDomain: sys.subDomain,
      criticality: sys.criticality,
      techStack: sys.techStack,
      ownerTeamId: sys.ownerTeamId,
      smeId: sys.smeId,
      lifecycleStatus: sys.lifecycleStatus,
      debtScore: sys.debtScore,
      description: sys.description || '',
      platformCategory: sys.platformCategory,
      vendorId: sys.vendorId
    })),
    skipDuplicates: true
  });

  // 4. Create Initiatives
  console.log('Creating initiatives...');
  // We combine imported and mock
  const { importedInitiatives } = await import('../src/data/importedInitiatives.js');
  const allInitiatives = [...mockInitiatives, ...importedInitiatives];
  
  // Note: createMany doesn't handle nested relations (milestones, history).
  // For seeding efficiency we use a loop for initiatives if they have relations, 
  // or just simplify for the seed.
  for (const ini of allInitiatives) {
    await prisma.initiative.upsert({
      where: { id: ini.id },
      create: {
        id: ini.id,
        title: ini.title,
        type: ini.type,
        benefit: ini.benefit,
        benefitType: ini.benefitType,
        scope: ini.scope,
        customerOwner: ini.customerOwner,
        originDirectorate: ini.originDirectorate,
        leaderId: ini.leaderId,
        technicalLeadId: ini.technicalLeadId,
        status: ini.status,
        impactedSystemIds: ini.impactedSystemIds,
        businessExpectationDate: ini.businessExpectationDate,
        milestones: {
          create: ini.milestones?.map(m => ({
            name: m.name,
            systemId: m.systemId,
            baselineDate: m.baselineDate,
            realDate: m.realDate
          }))
        }
      },
      update: {}
    });
  }

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
