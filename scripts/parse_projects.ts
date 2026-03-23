import fs from 'fs';
import path from 'path';

const csvPath = 'c:/Users/niral/oraculo/tmp/projects.csv';
const outputPath = 'c:/Users/niral/oraculo/src/data/importedInitiatives.ts';

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');
const headers = lines[0].split(';');

const managerMap: Record<string, string> = {
  'Ricardo': 'c_ger_wm',
  'Quelly': 'c_ger_fa',
  'Marco': 'c_ger_nm',
  'Sally': 'c_ger_nm', // Fallback
  'Luiz': 'c_ger_fa',  // Fallback
  'Cupido': 'c_ger_wm',
  'Engenharia': 'c_ger_nm',
  'Luciene': 'c_ger_nm' // Fallback
};

const systemMap: Record<string, string> = {
  'CO Digital': 's_co_digital',
  'Order Entry': 's_order_entry',
  'MS Appointment': 's_ms_appointment',
  'Appointment': 's_ms_appointment',
  'Opera‡Æo Mobile': 's_opm',
  'OPM': 's_opm',
  'FSL': 's_fsl',
  'AntecipaSA': 's_antecipa_sa',
  'SOM': 's_som_ftth',
  'Maestro': 's_maestro',
  'NETQ': 's_netq',
  'Smartdesk': 's_smartdesk',
  'SmartDesk': 's_smartdesk'
};

const statusMap: Record<string, string> = {
  'Em Produ‡Æo': '5- Entregue',
  'Aguardando Release': '4- Em Execução',
  'Em Teste': '4- Em Execução',
  'Em Desenvolvimento': '4- Em Execução',
  'Em Planejamento': '3- Em Planejamento',
  'Em planejamento': '3- Em Planejamento',
  'Em Discovery': '1- Em Avaliação',
  'Aguardando DRI': '2- Em Backlog',
  'Despriorizado': 'Cancelado',
  'Dispriorizado': 'Cancelado'
};

const typeMap: Record<string, string> = {
  '1- ALTA': 'Estratégico',
  '2- MDIA': 'Projeto',
  '3 - BAIXA': 'Fast Track',
  '4- NOVA DEM': 'Projeto'
};

const initiatives = [];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  // Basic split (doesn't handle quoted semicolons perfectly but should work for this content)
  const cols = lines[i].split(';');
  if (cols.length < 10) continue;

  const title = cols[0];
  const lot = cols[1];
  const owner = cols[2];
  const priorityRaw = cols[3];
  const description = cols[4];
  const healthRaw = cols[5];
  const leaderName = cols[6];
  const scope = cols[7];
  const systemRaw = cols[8];
  const statusRaw = cols[9];
  const deadline = cols[11];
  const dev = cols[12];
  const obs = cols[13];
  const requirements = cols[14];

  const type = typeMap[priorityRaw] || 'Projeto';
  const status = statusMap[statusRaw] || '1- Em Avaliação';
  const leaderId = managerMap[leaderName] || 'c_ger_nm';
  
  const systems = systemRaw.split('/').map(s => systemMap[s.trim()] || s.trim()).filter(Boolean);

  const initiative = {
    id: `csv_${i}`,
    title,
    type,
    benefit: description,
    benefitType: 'Redução Custos',
    scope: `${scope}\n\nRequisitos:\n${requirements}`,
    customerOwner: owner,
    originDirectorate: lot,
    leaderId,
    technicalLeadId: dev,
    impactedSystemIds: systems,
    createdAt: new Date().toISOString(),
    businessExpectationDate: deadline ? deadline.split('/').reverse().join('-') : undefined,
    status,
    history: [
      {
        id: `h_${i}_1`,
        timestamp: new Date().toISOString(),
        user: 'Sistema',
        action: 'Carga Inicial via CSV',
        notes: obs
      }
    ],
    milestones: []
  };

  initiatives.push(initiative);
}

const fileContent = `import type { Initiative } from '../types';

export const importedInitiatives: Initiative[] = ${JSON.stringify(initiatives, null, 2)};
`;

fs.writeFileSync(outputPath, fileContent);
console.log(`Saved ${initiatives.length} initiatives to ${outputPath}`);
