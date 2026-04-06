import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const company = await prisma.company.findFirst({ where: { fantasyName: { contains: 'Sterlabs', mode: 'insensitive' } } });
  const dept = await prisma.department.findFirst({ where: { companyId: company?.id, name: { contains: 'Geral', mode: 'insensitive' } } });
  
  if (dept) {
    // @ts-ignore
    await prisma.$transaction([
      prisma.collaborator.update({ 
        where: { id: 'u_01' }, 
        data: { 
          email: 'niraldojunior@gmail.com',
          name: 'Niraldo Junior',
          role: 'Master',
          departmentId: dept.id,
          companyId: company?.id
        } 
      }),
      prisma.department.update({ where: { id: dept.id }, data: { masterUserId: 'u_01' } })
    ]);
    console.log('Successfully updated niraldojunior@gmail.com (was u_01) as master of Geral/Sterlabs');
  } else {
    console.error('Dept Geral/Sterlabs not found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
