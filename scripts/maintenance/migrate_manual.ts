import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'System';
    `;
    const columnNames = columns.map(c => c.column_name);
    console.log('Columns:', columnNames);

    const missingColumns = [
      { name: 'platformName', type: 'TEXT' },
      { name: 'platformCategory', type: 'TEXT' },
      { name: 'repoUrl', type: 'TEXT' },
      { name: 'environments', type: 'JSONB' },
      { name: 'contextFiles', type: 'JSONB' }
    ];

    for (const col of missingColumns) {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding ${col.name} column...`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "System" ADD COLUMN "${col.name}" ${col.type};`);
        console.log(`${col.name} column added.`);
      }
    }
  } catch (error) {
    console.error('FULL ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();