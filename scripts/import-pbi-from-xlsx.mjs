import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INPUT_FILE = process.argv[2] || 'CargaPBIs.xlsx';
const DRY_RUN = String(process.env.DRY_RUN || 'true').toLowerCase() === 'true';
const MAX_ROWS = Number(process.env.MAX_ROWS || '0');
const LOG_EVERY = Number(process.env.LOG_EVERY || '10');

const normalize = (v) =>
  String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const firstToken = (v) => normalize(v).split(/\s+/).filter(Boolean)[0] || '';

const toDateOnly = (v) => {
  const raw = String(v || '').trim();
  if (!raw) return null;
  const datePart = raw.split(' ')[0];
  const m = datePart.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  return null;
};

const mapPriority = (v) => {
  const n = normalize(v);
  if (n.includes('critical') || n.startsWith('1-')) return 1;
  if (n.includes('high') || n.startsWith('2-')) return 2;
  if (n.includes('medium') || n.startsWith('3-')) return 3;
  if (n.includes('low') || n.startsWith('4-')) return 4;
  return 0;
};

const mapStatus = (v) => {
  const n = normalize(v);
  if (n.includes('closed') || n.includes('resolved') || n.includes('done')) return '9- Concluído';
  if (n.includes('uat')) return '7- UAT';
  if (n.includes('qa') || n.includes('test')) return '6- QA';
  if (n.includes('implement') || n.includes('deploy')) return '8- Implantação';
  if (n.includes('progress') || n.includes('working') || n.includes('assigned')) return '5- Construção';
  if (n.includes('plan')) return '3- Planejamento';
  if (n.includes('backlog') || n.includes('new') || n.includes('open')) return '1- Backlog';
  return '1- Backlog';
};

const pickLeader = (rawName, collaborators, preferredCompanyId, preferredDepartmentId) => {
  const n = normalize(rawName);
  const tok = firstToken(rawName);
  if (!n) return { leader: null, reason: 'gestor vazio' };

  let candidates = collaborators.filter((c) => normalize(c.name) === n);
  if (candidates.length === 0) {
    candidates = collaborators.filter((c) => firstToken(c.name) === tok && tok);
  }
  if (candidates.length === 0) {
    candidates = collaborators.filter((c) => normalize(c.name).includes(n) || n.includes(normalize(c.name)));
  }
  if (candidates.length === 0) return { leader: null, reason: `gestor nao encontrado: ${rawName}` };

  const scoped = candidates.filter(
    (c) =>
      (!preferredCompanyId || c.companyId === preferredCompanyId) &&
      (!preferredDepartmentId || c.departmentId === preferredDepartmentId)
  );

  if (scoped.length === 1) return { leader: scoped[0], reason: null };
  if (scoped.length > 1) return { leader: scoped[0], reason: `gestor ambiguo: ${rawName} (${scoped.length} matches no escopo)` };
  if (candidates.length === 1) return { leader: candidates[0], reason: null };

  return { leader: candidates[0], reason: `gestor ambiguo: ${rawName} (${candidates.length} matches)` };
};

const main = async () => {
  const wb = xlsx.readFile(INPUT_FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  const effectiveRows = MAX_ROWS > 0 ? rows.slice(0, MAX_ROWS) : rows;

  const collaborators = await prisma.collaborator.findMany({
    select: { id: true, name: true, companyId: true, departmentId: true }
  });
  const systems = await prisma.system.findMany({
    select: { id: true, name: true, companyId: true, departmentId: true }
  });

  const systemsByName = new Map();
  for (const s of systems) systemsByName.set(normalize(s.name), s);

  const report = {
    totalRows: effectiveRows.length,
    planned: 0,
    inserted: 0,
    skippedExisting: 0,
    invalid: 0,
    warnings: 0,
    warningLines: [],
    errors: []
  };

  for (let i = 0; i < effectiveRows.length; i += 1) {
    const rowNum = i + 2;
    const r = effectiveRows[i];

    if (!DRY_RUN && LOG_EVERY > 0 && i > 0 && i % LOG_EVERY === 0) {
      console.log(`[progress] processed ${i}/${effectiveRows.length}`);
    }

    const externalName = String(r['Link Exerno'] || '').trim();
    const externalType = String(r['Plataforma Link Externo'] || '').trim();
    const systemName = String(r['Sistema'] || '').trim();
    const gestorName = String(r['Gestor'] || '').trim();
    const title = String(r['Titulo'] || '').trim();
    const description = String(r['Descrição'] || '').trim();

    if (!title) {
      report.invalid += 1;
      report.errors.push({ row: rowNum, reason: 'titulo vazio' });
      continue;
    }

    const system = systemsByName.get(normalize(systemName)) || null;

    const leaderPick = pickLeader(
      gestorName,
      collaborators,
      system?.companyId || null,
      system?.departmentId || null
    );

    if (!leaderPick.leader) {
      report.invalid += 1;
      report.errors.push({ row: rowNum, reason: leaderPick.reason || 'leaderId ausente' });
      continue;
    }

    if (leaderPick.reason) {
      report.warnings += 1;
      report.warningLines.push({ row: rowNum, warning: leaderPick.reason });
    }

    const companyId = leaderPick.leader.companyId;
    const departmentId = leaderPick.leader.departmentId;

    const existing = await prisma.initiative.findFirst({
      where: {
        companyId,
        departmentId,
        type: '4- PBI',
        OR: [
          ...(externalName ? [{ externalLinkName: externalName }] : []),
          { title }
        ]
      },
      select: { id: true }
    });

    if (existing) {
      report.skippedExisting += 1;
      continue;
    }

    const payload = {
      companyId,
      departmentId,
      title,
      type: '4- PBI',
      initiativeType: '4- PBI',
      benefit: title,
      scope: description || title,
      customerOwner: systemName || 'Não informado',
      originDirectorate: 'Não informado',
      leaderId: leaderPick.leader.id,
      impactedSystemIds: system ? [system.id] : [],
      status: mapStatus(r['Investigation Status']),
      requestDate: toDateOnly(r['Data Criação']),
      startDate: toDateOnly(r['Data Inicio']),
      endDate: toDateOnly(r['Target Resolution Date']),
      externalLinkType: externalType || null,
      externalLinkName: externalName || null,
      rationale: description || null,
      priority: mapPriority(r['Prioridade']),
      macroScope: [],
      memberIds: []
    };

    report.planned += 1;

    if (!DRY_RUN) {
      await prisma.initiative.create({ data: payload });
      report.inserted += 1;
    }
  }

  console.log(JSON.stringify({ dryRun: DRY_RUN, report }, null, 2));

  await prisma.$disconnect();
};

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
