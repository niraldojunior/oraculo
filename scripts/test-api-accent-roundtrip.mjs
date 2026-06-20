import 'dotenv/config';
import oracledb from 'oracledb';

function cps(value) {
  return Array.from(String(value ?? '')).map((char) => char.codePointAt(0));
}

async function main() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3011';
  const initiativeId = process.argv[2] || '4283e616-fd7c-44f7-b868-8669a760b1d6';
  const targetName = 'Módulo Admin API UTF8';

  const getRes = await fetch(`${baseUrl}/api/initiatives/${initiativeId}`);
  if (!getRes.ok) {
    throw new Error(`GET failed: ${getRes.status}`);
  }
  const full = await getRes.json();
  if (!Array.isArray(full.milestones) || full.milestones.length === 0) {
    throw new Error('No milestones in initiative payload');
  }

  full.milestones[0].name = targetName;

  const payload = {
    title: full.title,
    type: full.type,
    benefit: full.benefit,
    benefitType: full.benefitType,
    scope: full.scope,
    customerOwner: full.customerOwner,
    originDirectorate: full.originDirectorate,
    leaderId: full.leaderId,
    technicalLeadId: full.technicalLeadId,
    impactedSystemIds: full.impactedSystemIds,
    requestDate: full.requestDate,
    businessExpectationDate: full.businessExpectationDate,
    status: full.status,
    previousStatus: full.previousStatus,
    companyId: full.companyId,
    departmentId: full.departmentId,
    executingDirectorate: full.executingDirectorate,
    executingTeamId: full.executingTeamId,
    rationale: full.rationale,
    externalLinkType: full.externalLinkType,
    externalLinkName: full.externalLinkName,
    externalLinkUrl: full.externalLinkUrl,
    macroScope: full.macroScope,
    createdById: full.createdById,
    assignedManagerId: full.assignedManagerId,
    initiativeType: full.initiativeType,
    priority: full.priority,
    memberIds: full.memberIds,
    startDate: full.startDate,
    endDate: full.endDate,
    actualEndDate: full.actualEndDate,
    milestones: full.milestones,
    history: [
      {
        id: `h_test_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Encoding Probe',
        action: 'PATCH with UTF8 accent'
      }
    ]
  };

  const patchRes = await fetch(`${baseUrl}/api/initiatives/${initiativeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`PATCH failed: ${patchRes.status} ${text}`);
  }

  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
  });

  try {
    const milestoneId = full.milestones[0].id;
    const dbRow = await conn.execute(
      'SELECT "name" FROM "InitiativeMilestone" WHERE "id" = :id',
      { id: milestoneId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const stored = dbRow.rows?.[0]?.name ?? dbRow.rows?.[0]?.NAME;
    console.log('TARGET:', targetName);
    console.log('TARGET_CP:', cps(targetName).join(','));
    console.log('STORED:', stored);
    console.log('STORED_CP:', cps(stored).join(','));
  } finally {
    await conn.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
