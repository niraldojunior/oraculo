import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "MilestoneTask" ADD COLUMN IF NOT EXISTS "systemIds" TEXT[] DEFAULT \'{}\'');
    console.log('systemIds OK');
    await prisma.$executeRawUnsafe('ALTER TABLE "MilestoneTask" ADD COLUMN IF NOT EXISTS "priority" INTEGER');
    console.log('priority OK');
    await prisma.$executeRawUnsafe('ALTER TABLE "MilestoneTask" ADD COLUMN IF NOT EXISTS "taskHistory" JSONB DEFAULT \'[]\'');
    console.log('taskHistory OK');
    console.log('All columns added successfully');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
