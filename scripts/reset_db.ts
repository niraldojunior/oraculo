import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { 
  mockCompanies, 
  mockTeams, 
  mockCollaborators, 
  mockSystems,
  mockVendors,
  mockContracts
} from '../src/data/mockDb.js';
import { importedInitiatives } from '../src/data/importedInitiatives.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- RESETTING DATABASE ---');

  // Order matters for deletion (foreign keys)
  await prisma.initiativeHistory.deleteMany();
  await prisma.initiativeMilestone.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.system.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.team.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();

  console.log('Database cleared.');

  // 1. Companies
  console.log('Seeding Companies...');
  await prisma.company.createMany({ data: mockCompanies });

  // 2. Departments (Mock doesn't have a list, but we know d_core is used)
  console.log('Seeding Departments...');
  await prisma.department.create({
    data: {
      id: 'd_core',
      name: 'Engenharia e Operações',
      companyId: 'c_vtal'
    }
  });

  // 3. Teams
  console.log('Seeding Teams...');
  await prisma.team.createMany({ 
    data: mockTeams.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      parentTeamId: t.parentTeamId,
      leaderId: t.leaderId,
      companyId: t.companyId,
      departmentId: t.departmentId
    }))
  });

  // 4. Collaborators
  console.log('Seeding Collaborators...');
  await prisma.collaborator.createMany({
    data: mockCollaborators.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      squadId: c.squadId,
      photoUrl: c.photoUrl,
      phone: c.phone,
      bio: c.bio,
      companyId: c.companyId,
      departmentId: c.departmentId
    }))
  });

  // 5. Vendors
  console.log('Seeding Vendors...');
  await prisma.vendor.createMany({ data: mockVendors });

  // 6. Systems
  console.log('Seeding Systems...');
  await prisma.system.createMany({
    data: mockSystems.map(s => ({
      id: s.id,
      name: s.name,
      platformName: s.platformName,
      domain: s.domain,
      subDomain: s.subDomain,
      criticality: s.criticality,
      techStack: s.techStack,
      ownerTeamId: s.ownerTeamId,
      smeId: s.smeId,
      lifecycleStatus: s.lifecycleStatus,
      debtScore: s.debtScore,
      description: s.description,
      platformCategory: s.platformCategory,
      vendorId: s.vendorId,
      companyId: s.companyId,
      departmentId: s.departmentId
    }))
  });

  // 7. Initiatives (Cleaning up and seeding)
  console.log('Seeding Initiatives...');
  for (const ini of importedInitiatives) {
     // Ensure it has valid company/dept
     if (!ini.companyId) ini.companyId = 'c_vtal';
     if (!ini.departmentId) ini.departmentId = 'd_core';

     await prisma.initiative.create({
       data: {
         id: ini.id,
         companyId: ini.companyId,
         departmentId: ini.departmentId,
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
         businessExpectationDate: ini.businessExpectationDate
       }
     });
  }

  console.log('--- DATABASE RESET & SEEDED SUCCESSFULLY ---');
}

main()
  .catch(e => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
