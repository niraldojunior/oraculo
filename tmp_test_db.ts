
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    await prisma.$connect();
    console.log('Connection successful!');
    const companies = await prisma.company.findMany({ take: 1 });
    console.log('Query successful, found companies:', companies.length);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
