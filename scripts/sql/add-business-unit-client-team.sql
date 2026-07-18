-- Adiciona as tabelas BusinessUnit (Unidade de Negócio) e ClientTeam (área cliente / demandante)
-- ao banco Postgres/Supabase, correspondendo aos models adicionados em
-- src/infrastructure/persistence/prisma/schema.prisma.
--
-- Aplicação: rode este script no Supabase (SQL Editor) ou via psql.
-- É puramente ADITIVO — não altera nem remove nenhuma tabela/coluna existente.
-- (Deliberadamente NÃO inclui o "DROP COLUMN InitiativeComment.userPhoto" que o
--  `prisma db push` sugeriria, pois é drift pré-existente e não faz parte desta feature.)
--
-- Após rodar, `npx prisma db push` deve reportar as duas tabelas como já sincronizadas.

BEGIN;

CREATE TABLE "BusinessUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "BusinessUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    CONSTRAINT "ClientTeam_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessUnit_companyId_departmentId_idx" ON "BusinessUnit"("companyId", "departmentId");
CREATE INDEX "ClientTeam_companyId_departmentId_idx" ON "ClientTeam"("companyId", "departmentId");

ALTER TABLE "BusinessUnit" ADD CONSTRAINT "BusinessUnit_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessUnit" ADD CONSTRAINT "BusinessUnit_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClientTeam" ADD CONSTRAINT "ClientTeam_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientTeam" ADD CONSTRAINT "ClientTeam_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientTeam" ADD CONSTRAINT "ClientTeam_businessUnitId_fkey"
    FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
