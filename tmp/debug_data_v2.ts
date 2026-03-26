
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log('--- Companies ---');
  companies.forEach(c => console.log(`${c.id}: ${c.fantasyName}`));

  const depts = await prisma.department.findMany();
  console.log('\n--- Departments ---');
  depts.forEach(d => console.log(`${d.id}: ${d.name} (Company: ${d.companyId})`));

  console.log('\n--- Collaborators (Debora) ---');
  const collabs = await prisma.collaborator.findMany({
    where: { name: { contains: 'Debora', mode: 'insensitive' } }
  });
  collabs.forEach(c => console.log(`${c.id}: ${c.name} (Co: ${c.companyId}, Dept: ${c.departmentId})`));

  console.log('\n--- Teams (Rede/Dados/Telecom) ---');
  const teams = await prisma.team.findMany({
    where: { 
      OR: [
        { name: { contains: 'Rede', mode: 'insensitive' } },
        { name: { contains: 'Dados', mode: 'insensitive' } },
        { name: { contains: 'Telecom', mode: 'insensitive' } }
      ]
    }
  });
  teams.forEach(t => console.log(`${t.id}: ${t.name} (Co: ${t.companyId}, Dept: ${t.departmentId})`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
