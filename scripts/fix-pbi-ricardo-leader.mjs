import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INPUT_FILE = process.argv[2] || 'CargaPBIs.xlsx';
const DRY_RUN = String(process.env.DRY_RUN || 'true').toLowerCase() === 'true';

const normalize = (v) =>
  String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const main = async () => {
  const collabs = await prisma.collaborator.findMany({
    where: {
      OR: [
        { name: { contains: 'Ricardo', mode: 'insensitive' } },
        { name: { contains: 'Faleiro', mode: 'insensitive' } },
        { name: { contains: 'Simoes', mode: 'insensitive' } },
        { name: { contains: 'Simões', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, role: true, companyId: true, departmentId: true }
  });

  const faleiro = collabs.find((c) => normalize(c.name).includes('ricardo') && normalize(c.name).includes('faleiro'));
  const simoes = collabs.find((c) => normalize(c.name).includes('ricardo') && normalize(c.name).includes('simoes'));

  if (!faleiro) throw new Error('Nao encontrei colaborador Ricardo Faleiro');
  if (!simoes) throw new Error('Nao encontrei colaborador Ricardo Simoes');

  const wb = xlsx.readFile(INPUT_FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const ricardoRows = rows.filter((r) => normalize(r['Gestor']) === 'ricardo');
  const linkNames = ricardoRows.map((r) => String(r['Link Exerno'] || '').trim()).filter(Boolean);
  const titles = ricardoRows.map((r) => String(r['Titulo'] || '').trim()).filter(Boolean);

  const candidates = await prisma.initiative.findMany({
    where: {
      type: '4- PBI',
      leaderId: faleiro.id,
      OR: [
        ...(linkNames.length > 0 ? [{ externalLinkName: { in: linkNames } }] : []),
        ...(titles.length > 0 ? [{ title: { in: titles } }] : [])
      ]
    },
    select: {
      id: true,
      title: true,
      externalLinkName: true,
      leaderId: true,
      companyId: true,
      departmentId: true
    }
  });

  const outOfScope = candidates.filter(
    (it) => it.companyId !== simoes.companyId || it.departmentId !== simoes.departmentId
  );

  const report = {
    dryRun: DRY_RUN,
    ricardoFaleiro: faleiro,
    ricardoSimoes: simoes,
    spreadsheetRicardoRows: ricardoRows.length,
    candidatesFound: candidates.length,
    outOfScopeCount: outOfScope.length,
    updated: 0,
    sample: candidates.slice(0, 10)
  };

  if (outOfScope.length > 0) {
    throw new Error(`Encontradas ${outOfScope.length} iniciativas fora do escopo de empresa/departamento do Ricardo Simoes`);
  }

  if (!DRY_RUN && candidates.length > 0) {
    const ids = candidates.map((c) => c.id);
    const result = await prisma.initiative.updateMany({
      where: { id: { in: ids } },
      data: { leaderId: simoes.id }
    });
    report.updated = result.count;
  }

  console.log(JSON.stringify(report, null, 2));

  await prisma.$disconnect();
};

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
