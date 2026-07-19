import { config as loadEnv } from 'dotenv';
import oracledb from 'oracledb';

loadEnv({ path: '.env.local' });
loadEnv();

type DdlStep = {
  name: string;
  sql: string;
};

const requiredEnv = ['ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECTION_STRING'] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const tables: DdlStep[] = [
  {
    name: 'Company',
    sql: `
      CREATE TABLE "Company" (
        "id" VARCHAR2(36) NOT NULL,
        "fantasyName" VARCHAR2(255) NOT NULL,
        "realName" VARCHAR2(255) NOT NULL,
        "logo" CLOB NOT NULL,
        "description" CLOB NOT NULL,
        CONSTRAINT "PK_Company" PRIMARY KEY ("id")
      )
    `
  },
  {
    name: 'Department',
    sql: `
      CREATE TABLE "Department" (
        "id" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "masterUserId" VARCHAR2(36),
        CONSTRAINT "PK_Department" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Department_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      )
    `
  },
  {
    name: 'Collaborator',
    sql: `
      CREATE TABLE "Collaborator" (
        "id" VARCHAR2(36) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "email" VARCHAR2(320) NOT NULL,
        "role" VARCHAR2(255) NOT NULL,
        "teamId" VARCHAR2(36),
        "photoUrl" CLOB,
        "phone" VARCHAR2(50),
        "bio" CLOB,
        "linkedinUrl" VARCHAR2(1024),
        "githubUrl" VARCHAR2(1024),
        "password" VARCHAR2(255) DEFAULT '123456' NOT NULL,
        "isAdmin" NUMBER(1) DEFAULT 0 NOT NULL,
        "vacationStart" VARCHAR2(10),
        "startDate" VARCHAR2(10),
        "endDate" VARCHAR2(10),
        "birthday" VARCHAR2(5),
        "uf" VARCHAR2(2),
        "associatedCompanyIds" CLOB DEFAULT '[]' NOT NULL,
        CONSTRAINT "PK_Collaborator" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Collaborator_Email" UNIQUE ("email"),
        CONSTRAINT "FK_Collab_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_Collab_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      )
    `
  },
  {
    name: 'Absence',
    sql: `
      CREATE TABLE "Absence" (
        "id" VARCHAR2(36) NOT NULL,
        "collaboratorId" VARCHAR2(36) NOT NULL,
        "startDate" VARCHAR2(10) NOT NULL,
        "endDate" VARCHAR2(10) NOT NULL,
        "type" VARCHAR2(100) NOT NULL,
        "reason" CLOB,
        CONSTRAINT "PK_Absence" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Absence_Collab" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE
      )
    `
  },
  {
    name: 'Holiday',
    sql: `
      CREATE TABLE "Holiday" (
        "id" VARCHAR2(36) NOT NULL,
        "date" VARCHAR2(10) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "companyId" VARCHAR2(36),
        CONSTRAINT "PK_Holiday" PRIMARY KEY ("id")
      )
    `
  },
  {
    name: 'Skill',
    sql: `
      CREATE TABLE "Skill" (
        "id" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "description" CLOB NOT NULL,
        "familia" VARCHAR2(255),
        "icon" CLOB,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        CONSTRAINT "PK_Skill" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Skill_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_Skill_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      )
    `
  },
  {
    name: 'CollaboratorSkill',
    sql: `
      CREATE TABLE "CollaboratorSkill" (
        "collaboratorId" VARCHAR2(36) NOT NULL,
        "skillId" VARCHAR2(36) NOT NULL,
        CONSTRAINT "PK_CollaboratorSkill" PRIMARY KEY ("collaboratorId", "skillId"),
        CONSTRAINT "FK_CollabSkill_Collab" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id"),
        CONSTRAINT "FK_CollabSkill_Skill" FOREIGN KEY ("skillId") REFERENCES "Skill"("id")
      )
    `
  },
  {
    name: 'BusinessUnit',
    sql: `
      CREATE TABLE "BusinessUnit" (
        "id" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        CONSTRAINT "PK_BusinessUnit" PRIMARY KEY ("id"),
        CONSTRAINT "FK_BusinessUnit_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_BusinessUnit_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      )
    `
  },
  {
    name: 'ClientTeam',
    sql: `
      CREATE TABLE "ClientTeam" (
        "id" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "businessUnitId" VARCHAR2(36),
        CONSTRAINT "PK_ClientTeam" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ClientTeam_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_ClientTeam_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id"),
        CONSTRAINT "FK_ClientTeam_BusinessUnit" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id")
      )
    `
  },
  {
    name: 'Team',
    sql: `
      CREATE TABLE "Team" (
        "id" VARCHAR2(36) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "type" VARCHAR2(255) NOT NULL,
        "parentTeamId" VARCHAR2(36),
        "leaderId" VARCHAR2(36),
        "receivesInitiatives" NUMBER(1) DEFAULT 0 NOT NULL,
        CONSTRAINT "PK_Team" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Team_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_Team_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      )
    `
  },
  {
    name: 'System',
    sql: `
      CREATE TABLE "System" (
        "id" VARCHAR2(36) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "category" VARCHAR2(255),
        "criticality" VARCHAR2(100) NOT NULL,
        "ownerTeamId" VARCHAR2(36),
        "lifecycleStatus" VARCHAR2(100) NOT NULL,
        "debtScore" NUMBER DEFAULT 0 NOT NULL,
        "description" CLOB NOT NULL,
        "environments" CLOB,
        "contextFiles" CLOB,
        "technicalSkills" CLOB,
        "responsibleCollaborators" CLOB,
        CONSTRAINT "PK_System" PRIMARY KEY ("id"),
        CONSTRAINT "FK_System_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_System_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      )
    `
  },
  {
    name: 'Vendor',
    sql: `
      CREATE TABLE "Vendor" (
        "id" VARCHAR2(36) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "companyName" VARCHAR2(255) NOT NULL,
        "taxId" VARCHAR2(50) NOT NULL,
        "type" VARCHAR2(100) NOT NULL,
        "logoUrl" CLOB,
        "directorId" VARCHAR2(36),
        "managerId" VARCHAR2(36),
        CONSTRAINT "PK_Vendor" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Vendor_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_Vendor_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      )
    `
  },
  {
    name: 'Contract',
    sql: `
      CREATE TABLE "Contract" (
        "id" VARCHAR2(36) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "vendorId" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255),
        "number" VARCHAR2(100) NOT NULL,
        "startDate" VARCHAR2(10) NOT NULL,
        "endDate" VARCHAR2(10) NOT NULL,
        "model" VARCHAR2(100) NOT NULL,
        "annualCost" NUMBER NOT NULL,
        "description" CLOB,
        "status" VARCHAR2(100) DEFAULT 'Ativo' NOT NULL,
        "systemId" VARCHAR2(36),
        "leaderId" VARCHAR2(36),
        CONSTRAINT "PK_Contract" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Contract_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_Contract_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id"),
        CONSTRAINT "FK_Contract_Vendor" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id"),
        CONSTRAINT "FK_Contract_System" FOREIGN KEY ("systemId") REFERENCES "System"("id"),
        CONSTRAINT "FK_Contract_Leader" FOREIGN KEY ("leaderId") REFERENCES "Collaborator"("id")
      )
    `
  },
  {
    name: 'Initiative',
    sql: `
      CREATE TABLE "Initiative" (
        "id" VARCHAR2(36) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "title" VARCHAR2(500) NOT NULL,
        "type" VARCHAR2(255) NOT NULL,
        "benefit" CLOB NOT NULL,
        "benefitType" VARCHAR2(255),
        "scope" CLOB NOT NULL,
        "customerOwner" VARCHAR2(255) NOT NULL,
        "clientTeamId" VARCHAR2(36),
        "leaderId" VARCHAR2(36),
        "technicalLeadId" VARCHAR2(36),
        "impactedSystemIds" CLOB DEFAULT '[]' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "requestDate" VARCHAR2(10),
        "businessExpectationDate" VARCHAR2(10),
        "status" VARCHAR2(100) NOT NULL,
        "previousStatus" VARCHAR2(100),
        "executingTeamId" VARCHAR2(36),
        "executingDirectorate" VARCHAR2(255),
        "rationale" CLOB,
        "externalLinkType" VARCHAR2(255),
        "externalLinkName" VARCHAR2(255),
        "externalLinkUrl" VARCHAR2(1024),
        "macroScope" CLOB DEFAULT '[]' NOT NULL,
        "createdById" VARCHAR2(36),
        "assignedManagerId" VARCHAR2(36),
        "initiativeType" VARCHAR2(255),
        "priority" NUMBER DEFAULT 0 NOT NULL,
        "memberIds" CLOB DEFAULT '[]' NOT NULL,
        "startDate" VARCHAR2(10),
        "endDate" VARCHAR2(10),
        "actualEndDate" VARCHAR2(10),
        CONSTRAINT "PK_Initiative" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Initiative_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_Initiative_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id"),
        CONSTRAINT "FK_Initiative_ClientTeam" FOREIGN KEY ("clientTeamId") REFERENCES "ClientTeam"("id")
      )
    `
  },
  {
    name: 'InitiativeMilestone',
    sql: `
      CREATE TABLE "InitiativeMilestone" (
        "id" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(255) NOT NULL,
        "systemId" VARCHAR2(36) NOT NULL,
        "baselineDate" VARCHAR2(10) NOT NULL,
        "realDate" VARCHAR2(10),
        "description" CLOB,
        "assignedEngineerId" VARCHAR2(36),
        "startDate" VARCHAR2(10),
        "order" NUMBER,
        "initiativeId" VARCHAR2(36) NOT NULL,
        CONSTRAINT "PK_InitiativeMilestone" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Milestone_Initiative" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id")
      )
    `
  },
  {
    name: 'MilestoneTask',
    sql: `
      CREATE TABLE "MilestoneTask" (
        "id" VARCHAR2(36) NOT NULL,
        "name" VARCHAR2(500) NOT NULL,
        "status" VARCHAR2(100) DEFAULT 'Backlog' NOT NULL,
        "type" VARCHAR2(255),
        "assigneeId" VARCHAR2(36),
        "systemId" VARCHAR2(36),
        "systemIds" CLOB DEFAULT '[]' NOT NULL,
        "priority" NUMBER,
        "startDate" VARCHAR2(10),
        "targetDate" VARCHAR2(10),
        "notes" CLOB,
        "taskHistory" CLOB DEFAULT '[]',
        "order" NUMBER NOT NULL,
        "milestoneId" VARCHAR2(36) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT "PK_MilestoneTask" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Task_Milestone" FOREIGN KEY ("milestoneId") REFERENCES "InitiativeMilestone"("id") ON DELETE CASCADE
      )
    `
  },
  {
    name: 'InitiativeHistory',
    sql: `
      CREATE TABLE "InitiativeHistory" (
        "id" VARCHAR2(36) NOT NULL,
        "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "user" VARCHAR2(255) NOT NULL,
        "action" VARCHAR2(255) NOT NULL,
        "fromStatus" VARCHAR2(100),
        "toStatus" VARCHAR2(100),
        "notes" CLOB,
        "initiativeId" VARCHAR2(36) NOT NULL,
        CONSTRAINT "PK_InitiativeHistory" PRIMARY KEY ("id"),
        CONSTRAINT "FK_History_Initiative" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id")
      )
    `
  },
  {
    name: 'InitiativeComment',
    sql: `
      CREATE TABLE "InitiativeComment" (
        "id" VARCHAR2(36) NOT NULL,
        "content" CLOB NOT NULL,
        "userId" VARCHAR2(36) NOT NULL,
        "userName" VARCHAR2(255) NOT NULL,
        "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "initiativeId" VARCHAR2(36) NOT NULL,
        CONSTRAINT "PK_InitiativeComment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Comment_Initiative" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE
      )
    `
  },
  {
    name: 'Allocation',
    sql: `
      CREATE TABLE "Allocation" (
        "id" VARCHAR2(36) NOT NULL,
        "companyId" VARCHAR2(36) NOT NULL,
        "departmentId" VARCHAR2(36) NOT NULL,
        "collaboratorId" VARCHAR2(36) NOT NULL,
        "initiativeId" VARCHAR2(36) NOT NULL,
        "systemId" VARCHAR2(36),
        "percentage" NUMBER NOT NULL,
        "startDate" VARCHAR2(10) NOT NULL,
        "endDate" VARCHAR2(10) NOT NULL,
        CONSTRAINT "PK_Allocation" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Allocation_Company" FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
        CONSTRAINT "FK_Allocation_Department" FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      )
    `
  }
];

const indexes: DdlStep[] = [
  { name: 'IX_Department_companyId', sql: 'CREATE INDEX "IX_Department_companyId" ON "Department" ("companyId")' },
  { name: 'IX_Collab_company_dept', sql: 'CREATE INDEX "IX_Collab_company_dept" ON "Collaborator" ("companyId", "departmentId")' },
  { name: 'IX_Absence_collaborator', sql: 'CREATE INDEX "IX_Absence_collaborator" ON "Absence" ("collaboratorId")' },
  { name: 'IX_Skill_company_dept', sql: 'CREATE INDEX "IX_Skill_company_dept" ON "Skill" ("companyId", "departmentId")' },
  { name: 'IX_BusinessUnit_company_dept', sql: 'CREATE INDEX "IX_BusinessUnit_company_dept" ON "BusinessUnit" ("companyId", "departmentId")' },
  { name: 'IX_ClientTeam_company_dept', sql: 'CREATE INDEX "IX_ClientTeam_company_dept" ON "ClientTeam" ("companyId", "departmentId")' },
  { name: 'IX_Team_company_dept', sql: 'CREATE INDEX "IX_Team_company_dept" ON "Team" ("companyId", "departmentId")' },
  { name: 'IX_System_company_dept', sql: 'CREATE INDEX "IX_System_company_dept" ON "System" ("companyId", "departmentId")' },
  { name: 'IX_Vendor_company_dept', sql: 'CREATE INDEX "IX_Vendor_company_dept" ON "Vendor" ("companyId", "departmentId")' },
  { name: 'IX_Contract_company_dept', sql: 'CREATE INDEX "IX_Contract_company_dept" ON "Contract" ("companyId", "departmentId")' },
  { name: 'IX_Initiative_company_dept', sql: 'CREATE INDEX "IX_Initiative_company_dept" ON "Initiative" ("companyId", "departmentId")' },
  { name: 'IX_Initiative_client_team', sql: 'CREATE INDEX "IX_Initiative_client_team" ON "Initiative" ("clientTeamId")' },
  { name: 'IX_Milestone_init_order', sql: 'CREATE INDEX "IX_Milestone_init_order" ON "InitiativeMilestone" ("initiativeId", "order")' },
  { name: 'IX_Task_milestone_order', sql: 'CREATE INDEX "IX_Task_milestone_order" ON "MilestoneTask" ("milestoneId", "order")' },
  { name: 'IX_History_init_time', sql: 'CREATE INDEX "IX_History_init_time" ON "InitiativeHistory" ("initiativeId", "timestamp")' },
  { name: 'IX_Comment_init_time', sql: 'CREATE INDEX "IX_Comment_init_time" ON "InitiativeComment" ("initiativeId", "timestamp")' },
  { name: 'IX_Allocation_company_dept', sql: 'CREATE INDEX "IX_Allocation_company_dept" ON "Allocation" ("companyId", "departmentId")' }
];

async function runDdl(connection: oracledb.Connection, ddl: DdlStep) {
  try {
    await connection.execute(ddl.sql);
    console.log(`[created] ${ddl.name}`);
  } catch (error: any) {
    if (error?.errorNum === 955) {
      console.log(`[exists ] ${ddl.name}`);
      return;
    }
    throw error;
  }
}

async function ensureInitiativeClientTeamRelation(connection: oracledb.Connection): Promise<void> {
  const columns = await connection.execute<{ COLUMN_NAME: string }>(
    `SELECT column_name FROM user_tab_columns WHERE table_name = 'Initiative'`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const names = new Set((columns.rows ?? []).map(row => String(row.COLUMN_NAME)));

  if (!names.has('clientTeamId')) {
    await connection.execute('ALTER TABLE "Initiative" ADD ("clientTeamId" VARCHAR2(36))');
    console.log('[created] Initiative.clientTeamId');
  }

  if (names.has('originDirectorate')) {
    await connection.execute('ALTER TABLE "Initiative" MODIFY ("originDirectorate" NULL)');
    console.log('[updated] Initiative.originDirectorate nullable');
  }

  const constraints = await connection.execute<{ CONSTRAINT_NAME: string }>(
    `SELECT constraint_name FROM user_constraints WHERE constraint_name = 'FK_Initiative_ClientTeam'`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if ((constraints.rows ?? []).length === 0) {
    await connection.execute(
      'ALTER TABLE "Initiative" ADD CONSTRAINT "FK_Initiative_ClientTeam" FOREIGN KEY ("clientTeamId") REFERENCES "ClientTeam"("id")'
    );
    console.log('[created] FK_Initiative_ClientTeam');
  }
}

async function main() {
  const connection = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
  });

  try {
    for (const table of tables) {
      await runDdl(connection, table);
    }

    await ensureInitiativeClientTeamRelation(connection);

    for (const index of indexes) {
      await runDdl(connection, index);
    }

    await connection.commit();

    const verify = await connection.execute<{
      TABLE_NAME: string;
    }>(
      `
        SELECT table_name
        FROM user_tables
        WHERE table_name IN (
          'Company','Department','Collaborator','Absence','Holiday','Skill','CollaboratorSkill',
          'BusinessUnit','ClientTeam',
          'Team','System','Vendor','Contract','Initiative','InitiativeMilestone',
          'MilestoneTask','InitiativeHistory','InitiativeComment','Allocation'
        )
        ORDER BY table_name
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('\nTables present:');
    for (const row of verify.rows ?? []) {
      console.log(`- ${row.TABLE_NAME}`);
    }
  } finally {
    await connection.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
