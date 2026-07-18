import { PrismaClient } from '@prisma/client';

const TABLES = [
  'Absence', 'Allocation', 'BusinessUnit', 'ClientTeam', 'CollaboratorSkill', 'Collaborator',
  'Contract', 'Department', 'Holiday', 'InitiativeComment', 'InitiativeHistory',
  'MilestoneTask', 'InitiativeMilestone', 'Initiative', 'Skill', 'System', 'Team', 'Vendor', 'Company'
];

export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export async function truncateAll(prisma: PrismaClient): Promise<void> {
  const quoted = TABLES.map(table => `"${table}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
}
