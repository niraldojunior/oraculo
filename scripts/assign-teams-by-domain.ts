import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DOMAIN_TO_TEAM: Record<string, string> = {
  'Network Management': 'Network Management',
  'Workforce Management': 'Workforce Management',
};

async function main() {
  for (const [domain, teamName] of Object.entries(DOMAIN_TO_TEAM)) {
    const team = await prisma.team.findFirst({ where: { name: teamName } });

    if (!team) {
      console.warn(`[SKIP] Time "${teamName}" não encontrado.`);
      continue;
    }

    const result = await prisma.system.updateMany({
      where: { domain },
      data: { ownerTeamId: team.id },
    });

    console.log(`[OK] Domínio "${domain}" → time "${teamName}" (${team.id}): ${result.count} sistema(s) atualizado(s).`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
