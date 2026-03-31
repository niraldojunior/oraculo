import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearInitiatives() {
  console.log('--- DELETING INITIATIVE-RELATED DATA ---');
  
  try {
    // 1. Delete Allocations
    const allocationsResult = await prisma.allocation.deleteMany({});
    console.log(`Deleted ${allocationsResult.count} Allocations.`);
    
    // 2. Delete Initiative Milestones (Detalhes/Marcos)
    const milestonesResult = await prisma.initiativeMilestone.deleteMany({});
    console.log(`Deleted ${milestonesResult.count} Milestones.`);
    
    // 3. Delete Initiative History (Histórico)
    const historyResult = await prisma.initiativeHistory.deleteMany({});
    console.log(`Deleted ${historyResult.count} History records.`);
    
    // 4. Delete Initiatives
    const initiativesResult = await prisma.initiative.deleteMany({});
    console.log(`Deleted ${initiativesResult.count} Initiatives.`);
    
    console.log('--- CLEANUP COMPLETED ---');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearInitiatives();
