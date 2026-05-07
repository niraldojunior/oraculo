// Run with: node scripts/migrate-statuses.cjs
// Updates Initiative.status, Initiative.previousStatus and InitiativeHistory.fromStatus/toStatus
// according to the new status nomenclature.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const map = {
  // legacy variants from previous nomenclature
  '4- Execução': '5- Construção',
  '4- Em Execução': '5- Construção',
  '5- Execução': '5- Construção',
  '5- Entregue': '9- Concluído',
  '5- Concluído': '9- Concluído',
  '6- Concluído': '9- Concluído',
  // shift caused by inserting "4- Aguardando Capacidade"
  '4- Construção': '5- Construção',
  '5- QA': '6- QA',
  '6- UAT': '7- UAT',
  '5- Implantação': '8- Implantação',
  '7- Implantação': '8- Implantação',
  '8- Concluído': '9- Concluído'
};

async function run() {
  let totalInitStatus = 0;
  let totalInitPrev = 0;
  let totalHistFrom = 0;
  let totalHistTo = 0;

  for (const [oldVal, newVal] of Object.entries(map)) {
    const r1 = await prisma.initiative.updateMany({
      where: { status: oldVal },
      data: { status: newVal }
    });
    totalInitStatus += r1.count;

    const r2 = await prisma.initiative.updateMany({
      where: { previousStatus: oldVal },
      data: { previousStatus: newVal }
    });
    totalInitPrev += r2.count;

    const r3 = await prisma.initiativeHistory.updateMany({
      where: { fromStatus: oldVal },
      data: { fromStatus: newVal }
    });
    totalHistFrom += r3.count;

    const r4 = await prisma.initiativeHistory.updateMany({
      where: { toStatus: oldVal },
      data: { toStatus: newVal }
    });
    totalHistTo += r4.count;

    console.log(`[${oldVal}] -> [${newVal}]  initiatives.status=${r1.count}  initiatives.previousStatus=${r2.count}  history.fromStatus=${r3.count}  history.toStatus=${r4.count}`);
  }

  console.log('---');
  console.log('Totals:');
  console.log('  Initiative.status         updated:', totalInitStatus);
  console.log('  Initiative.previousStatus updated:', totalInitPrev);
  console.log('  InitiativeHistory.fromStatus updated:', totalHistFrom);
  console.log('  InitiativeHistory.toStatus   updated:', totalHistTo);
}

run()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
