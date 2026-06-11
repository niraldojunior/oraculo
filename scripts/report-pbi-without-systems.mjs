import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INPUT_FILE = process.argv[2] || 'CargaPBIs.xlsx';

const main = async () => {
  const wb = xlsx.readFile(INPUT_FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const linkNames = rows.map((r) => String(r['Link Exerno'] || '').trim()).filter(Boolean);
  const titles = rows.map((r) => String(r['Titulo'] || '').trim()).filter(Boolean);

  const initiatives = await prisma.initiative.findMany({
    where: {
      type: '4- PBI',
      OR: [
        ...(linkNames.length ? [{ externalLinkName: { in: linkNames } }] : []),
        ...(titles.length ? [{ title: { in: titles } }] : [])
      ]
    },
    select: {
      id: true,
      title: true,
      externalLinkName: true,
      leaderId: true,
      impactedSystemIds: true
    }
  });

  const withoutSystems = initiatives.filter((it) => !Array.isArray(it.impactedSystemIds) || it.impactedSystemIds.length === 0);

  const output = {
    spreadsheetRows: rows.length,
    matchedInitiatives: initiatives.length,
    withoutSystemsCount: withoutSystems.length,
    withoutSystems
  };

  console.log(JSON.stringify(output, null, 2));
  await prisma.$disconnect();
};

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
