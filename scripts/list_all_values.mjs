import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listValues() {
  try {
    const all = await prisma.initiative.findMany({
      select: { status: true, type: true, initiativeType: true }
    });
    
    const statuses = Array.from(new Set(all.map(i => i.status)));
    const types = Array.from(new Set(all.map(i => i.type)));
    const initTypes = Array.from(new Set(all.map(i => i.initiativeType)));
    
    console.log('--- STATUSES ---');
    statuses.forEach(s => console.log(s));
    console.log('--- TYPES ---');
    types.forEach(t => console.log(t));
    console.log('--- INITIATIVETYPES ---');
    initTypes.forEach(it => console.log(it));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listValues();
