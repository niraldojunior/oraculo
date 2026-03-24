import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Initiatives in Database...');
  const initiatives = await prisma.initiative.findMany();
  
  console.log(`TOTAL INITIATIVES FOUND: ${initiatives.length}`);
  
  if (initiatives.length > 0) {
    initiatives.forEach((init, i) => {
      console.log(`${i+1}. [${init.id}] ${init.title} - Status: ${init.status}`);
    });
  } else {
    console.log('Database is EMPTY for initiatives.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
