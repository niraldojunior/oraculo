
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ALL DEPARTMENTS for V.tal ---');
  const depts = await prisma.department.findMany({ where: { companyId: 'c_vtal' } });
  depts.forEach(d => console.log(`${d.id}: ${d.name}`));

  console.log('\n--- ALL TEAMS for V.tal ---');
  const teams = await prisma.team.findMany({ where: { companyId: 'c_vtal' } });
  teams.forEach(t => console.log(`${t.id}: ${t.name} (Dept: ${t.departmentId})`));

  console.log('\n--- ALL COLLABORATORS for V.tal ---');
  const collabs = await prisma.collaborator.findMany({ where: { companyId: 'c_vtal' } });
  collabs.forEach(c => console.log(`${c.id}: ${c.name} (Dept: ${c.departmentId})`));

  console.log('\n--- Detailed check for "Debora Garcia" ---');
  const dGarcia = await prisma.collaborator.findMany({ where: { name: { contains: 'Garcia', mode: 'insensitive' } } });
  dGarcia.forEach(c => console.log(`${c.id}: ${c.name} - Co: ${c.companyId}, Dept: ${c.departmentId}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
