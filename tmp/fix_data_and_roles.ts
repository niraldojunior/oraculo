
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Data Realignment & Role Update ---');

  // 1. Update Roles: VP -> Head
  const roleUpdate = await prisma.collaborator.updateMany({
    where: { role: 'VP' },
    data: { role: 'Head' }
  });
  console.log(`Updated ${roleUpdate.count} collaborators from 'VP' to 'Head'.`);

  // 2. Fix Company Alignment for V.tal's TI Department (d_core)
  // We know d_core belongs to c_vtal.
  const deptTI = await prisma.department.findUnique({ where: { id: 'd_core' } });
  if (deptTI && deptTI.companyId === 'c_vtal') {
    const collabUpdate = await prisma.collaborator.updateMany({
      where: { departmentId: 'd_core', companyId: { not: 'c_vtal' } },
      data: { companyId: 'c_vtal' }
    });
    console.log(`Realigned ${collabUpdate.count} collaborators in TI to V.tal (c_vtal).`);

    const teamUpdate = await prisma.team.updateMany({
      where: { departmentId: 'd_core', companyId: { not: 'c_vtal' } },
      data: { companyId: 'c_vtal' }
    });
    console.log(`Realigned ${teamUpdate.count} teams in TI to V.tal (c_vtal).`);

    const systemUpdate = await prisma.system.updateMany({
      where: { departmentId: 'd_core', companyId: { not: 'c_vtal' } },
      data: { companyId: 'c_vtal' }
    });
    console.log(`Realigned ${systemUpdate.count} systems in TI to V.tal (c_vtal).`);

    const initiativeUpdate = await prisma.initiative.updateMany({
      where: { departmentId: 'd_core', companyId: { not: 'c_vtal' } },
      data: { companyId: 'c_vtal' }
    });
    console.log(`Realigned ${initiativeUpdate.count} initiatives in TI to V.tal (c_vtal).`);
  } else {
    console.error('Core TI department (d_core) not found or has unexpected companyId.');
  }

  // 3. General alignment check
  console.log('\n--- General Alignment Check ---');
  const allDepts = await prisma.department.findMany();
  for (const dept of allDepts) {
    const mismatchedTeams = await prisma.team.updateMany({
      where: { departmentId: dept.id, companyId: { not: dept.companyId } },
      data: { companyId: dept.companyId }
    });
    if (mismatchedTeams.count > 0) {
      console.log(`Fixed ${mismatchedTeams.count} mismatched teams for department ${dept.name} (${dept.id}).`);
    }

    const mismatchedCollabs = await prisma.collaborator.updateMany({
      where: { departmentId: dept.id, companyId: { not: dept.companyId } },
      data: { companyId: dept.companyId }
    });
    if (mismatchedCollabs.count > 0) {
      console.log(`Fixed ${mismatchedCollabs.count} mismatched collaborators for department ${dept.name} (${dept.id}).`);
    }
  }

  console.log('\n--- Data Realignment Complete ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
