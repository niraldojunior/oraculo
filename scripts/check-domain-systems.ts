import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rows = await prisma.system.findMany({
  where: { domain: { in: ['Network Management', 'Workforce Management'] } },
  select: { id: true, name: true, domain: true, ownerTeamId: true },
});

console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
