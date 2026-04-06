import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Finding Data ---');
  const companies = await prisma.company.findMany({
    where: { fantasyName: { contains: 'Sterlabs', mode: 'insensitive' } }
  });
  console.log('Companies:', JSON.stringify(companies, null, 2));

  if (companies.length === 0) {
    console.error('Sterlabs not found');
    return;
  }

  const depts = await prisma.department.findMany({
    where: { 
      companyId: companies[0].id,
      name: { contains: 'Geral', mode: 'insensitive' }
    }
  });
  console.log('Departments:', JSON.stringify(depts, null, 2));

  if (depts.length === 0) {
    console.error('Department Geral not found for Sterlabs');
    return;
  }

  const collabs = await prisma.collaborator.findMany({
    where: {
      OR: [
        { name: { contains: 'niraldojunior', mode: 'insensitive' } },
        { email: { contains: 'niraldojunior', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Collaborators:', JSON.stringify(collabs, null, 2));

  if (collabs.length === 0) {
    console.error('niraldojunior not found');
    return;
  }

  const collabId = collabs[0].id;
  const deptId = depts[0].id;

  console.log(`\n--- Updating Master User: Collab ${collabId} in Dept ${deptId} ---`);

  // Transactional logic:
  // 1. Demote current master user of this department (if any)
  // 2. Set new masterUserId in Department
  // 3. Promote new collaborator to Master role
  // 4. Assign new collaborator to the department
  
  await prisma.$transaction(async (tx) => {
    // 1. Find current master if any
    const currentDept = await tx.department.findUnique({ where: { id: deptId } });
    if (currentDept?.masterUserId && currentDept.masterUserId !== collabId) {
       await tx.collaborator.update({
         where: { id: currentDept.masterUserId },
         data: { role: 'Operacional' } // Or default role
       });
    }

    // 2. Update Dept
    await tx.department.update({
      where: { id: deptId },
      data: { masterUserId: collabId }
    });

    // 3. Update Collab role and dept
    await tx.collaborator.update({
      where: { id: collabId },
      data: { 
        role: 'Master',
        departmentId: deptId,
        companyId: companies[0].id
      }
    });

    console.log('Update successful!');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
