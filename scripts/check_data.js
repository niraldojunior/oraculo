const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const all = await prisma.initiative.findMany({
    select: { id: true, title: true, status: true, type: true, initiativeType: true }
  });
  
  const byStatus = all.filter(i => i.status === 'ESTRATÉGICO');
  const byType = all.filter(i => i.type === 'ESTRATÉGICO');
  const byInitType = all.filter(i => i.initiativeType === 'ESTRATÉGICO');
  
  console.log('Total:', all.length);
  console.log('Status ESTRATÉGICO:', byStatus.length);
  console.log('Type ESTRATÉGICO:', byType.length);
  console.log('InitiativeType ESTRATÉGICO:', byInitType.length);
  
  if (byStatus.length > 0) console.log('Sample Status Example:', byStatus[0].title);
  if (byType.length > 0) console.log('Sample Type Example:', byType[0].title);
  
  await prisma.$disconnect();
}

check();
