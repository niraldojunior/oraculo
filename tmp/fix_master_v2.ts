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

  const collabs = await prisma.collaborator.findMany();
  console.log('Total Collaborators:', collabs.length);
  
  const targetCollab = collabs.find(c => 
    c.name.toLowerCase().includes('niraldo') || 
    c.email.toLowerCase().includes('niraldo')
  );

  if (!targetCollab) {
    console.error('Niraldo not found among:', collabs.map(c => `${c.name} (${c.email})`));
    return;
  }

  console.log('Target Collaborator Found:', JSON.stringify(targetCollab, null, 2));

  const collabId = targetCollab.id;
  const deptId = depts[0].id;

  console.log(`\n--- Updating Master User: ${targetCollab.name} in Dept ${depts[0].name} ---`);

  await prisma.$transaction(async (tx) => {
    // 1. Demote current masters of this department
    await tx.collaborator.updateMany({
      where: { departmentId: deptId, role: 'Master' },
      data: { role: 'Operacional' }
    });

    // 2. Set new masterUserId in Department
    await tx.department.update({
      where: { id: deptId },
      data: { masterUserId: collabId }
    });

    // 3. Promote target collaborator to Master role
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
