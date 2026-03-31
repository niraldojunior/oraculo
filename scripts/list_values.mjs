import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listValues() {
  try {
    const all = await prisma.initiative.findMany({
      select: { status: true, type: true, initiativeType: true }
    });
    
    const statuses = [...new Set(all.map(i => i.status))];
    const types = [...new Set(all.map(i => i.type))];
    const initTypes = [...new Set(all.map(i => i.initiativeType))];
    
    console.log('Statuses:', statuses);
    console.log('Types:', types);
    console.log('InitiativeTypes:', initTypes);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listValues();
