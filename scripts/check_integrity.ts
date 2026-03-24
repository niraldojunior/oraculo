import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log('--- COMPANIES ---');
  const companies = await prisma.company.findMany();
  console.log(JSON.stringify(companies, null, 2));

  console.log('\n--- DEPARTMENTS ---');
  const departments = await prisma.department.findMany();
  console.log(JSON.stringify(departments, null, 2));

  console.log('\n--- TEAMS ---');
  const teams = await prisma.team.findMany();
  console.log(`Total teams: ${teams.length}`);
  if (teams.length > 0) {
    console.log('First 3 teams:');
    console.log(JSON.stringify(teams.slice(0, 3), null, 2));
  }

  console.log('\n--- RECENT INITIATIVES ---');
  const initiatives = await prisma.initiative.findMany({ take: 5 });
  console.log(`Total initiatives: ${initiatives.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
