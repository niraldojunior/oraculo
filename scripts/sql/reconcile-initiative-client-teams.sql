-- Expansão e reconciliação Initiative -> ClientTeam (PostgreSQL/Supabase).
-- Mantém Initiative.originDirectorate para rollback; o contrato fica em arquivo separado.
-- Repetível: aborta diante de destinos ausentes/duplicados ou valores órfãos não previstos.

BEGIN;

ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "clientTeamId" TEXT;
ALTER TABLE "Initiative" ALTER COLUMN "originDirectorate" DROP NOT NULL;

CREATE TEMP TABLE "_ClientTeamMapping" (
  "sourceName" TEXT PRIMARY KEY,
  "targetName" TEXT NOT NULL,
  "businessUnitName" TEXT
) ON COMMIT DROP;

INSERT INTO "_ClientTeamMapping" ("sourceName", "targetName", "businessUnitName") VALUES
  ('Operação - FTTH', 'Operações e Engenharia', 'Rede Neutra & Nio'),
  ('Estratégia / NIO', 'Estratégia & NIO', 'Rede Neutra & Nio'),
  ('Operação - B2B/Atacado', 'Operações e Engenharia', 'Atacado & B2B'),
  ('Comercial FTTH', 'Comercial - FTTH', 'Rede Neutra & Nio'),
  ('Operação Logística', 'Operação - Logística', 'Rede Neutra & Nio');

DO $$
DECLARE
  invalid_target RECORD;
BEGIN
  SELECT mapping."sourceName", mapping."targetName", mapping."businessUnitName", COUNT(ct."id") AS matches
    INTO invalid_target
  FROM "_ClientTeamMapping" mapping
  LEFT JOIN "BusinessUnit" bu
    ON bu."name" = mapping."businessUnitName"
   AND bu."companyId" = 'c_vtal'
   AND bu."departmentId" = 'd_core'
  LEFT JOIN "ClientTeam" ct
    ON ct."name" = mapping."targetName"
   AND ct."companyId" = 'c_vtal'
   AND ct."departmentId" = 'd_core'
   AND ct."businessUnitId" = bu."id"
  GROUP BY mapping."sourceName", mapping."targetName", mapping."businessUnitName"
  HAVING COUNT(ct."id") <> 1
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Destino inválido para %: % / % (% correspondências)',
      invalid_target."sourceName", invalid_target."targetName",
      invalid_target."businessUnitName", invalid_target.matches;
  END IF;
END $$;

-- Correspondências atuais que são únicas por nome e escopo.
WITH unique_matches AS (
  SELECT "companyId", "departmentId", "name", MIN("id") AS "id"
  FROM "ClientTeam"
  GROUP BY "companyId", "departmentId", "name"
  HAVING COUNT(*) = 1
)
UPDATE "Initiative" initiative
SET "clientTeamId" = matches."id"
FROM unique_matches matches
WHERE matches."companyId" = initiative."companyId"
  AND matches."departmentId" = initiative."departmentId"
  AND matches."name" = initiative."originDirectorate";

-- Renomes/variações conhecidos, desambiguados pela Unidade de Negócio.
UPDATE "Initiative" initiative
SET "clientTeamId" = target."id"
FROM "_ClientTeamMapping" mapping
JOIN "BusinessUnit" bu
  ON bu."name" = mapping."businessUnitName"
 AND bu."companyId" = 'c_vtal'
 AND bu."departmentId" = 'd_core'
JOIN "ClientTeam" target
  ON target."name" = mapping."targetName"
 AND target."companyId" = 'c_vtal'
 AND target."departmentId" = 'd_core'
 AND target."businessUnitId" = bu."id"
WHERE initiative."companyId" = 'c_vtal'
  AND initiative."departmentId" = 'd_core'
  AND initiative."originDirectorate" = mapping."sourceName";

-- Áreas legadas aprovadas, sem Unidade de Negócio.
INSERT INTO "ClientTeam" ("id", "name", "companyId", "departmentId", "businessUnitId")
SELECT gen_random_uuid()::text, legacy."name", 'c_vtal', 'd_core', NULL
FROM (VALUES ('TI'), ('Operação'), ('Engenharia')) AS legacy("name")
WHERE NOT EXISTS (
  SELECT 1 FROM "ClientTeam" existing
  WHERE existing."companyId" = 'c_vtal'
    AND existing."departmentId" = 'd_core'
    AND existing."name" = legacy."name"
    AND existing."businessUnitId" IS NULL
);

DO $$
DECLARE
  invalid_legacy RECORD;
BEGIN
  SELECT legacy."name", COUNT(ct."id") AS matches
    INTO invalid_legacy
  FROM (VALUES ('TI'), ('Operação'), ('Engenharia')) AS legacy("name")
  LEFT JOIN "ClientTeam" ct
    ON ct."companyId" = 'c_vtal'
   AND ct."departmentId" = 'd_core'
   AND ct."name" = legacy."name"
   AND ct."businessUnitId" IS NULL
  GROUP BY legacy."name"
  HAVING COUNT(ct."id") <> 1
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Área legada inválida para % (% correspondências)',
      invalid_legacy."name", invalid_legacy.matches;
  END IF;
END $$;

UPDATE "Initiative" initiative
SET "clientTeamId" = target."id"
FROM "ClientTeam" target
WHERE initiative."companyId" = 'c_vtal'
  AND initiative."departmentId" = 'd_core'
  AND initiative."originDirectorate" IN ('TI', 'Operação', 'Engenharia')
  AND target."companyId" = initiative."companyId"
  AND target."departmentId" = initiative."departmentId"
  AND target."name" = initiative."originDirectorate"
  AND target."businessUnitId" IS NULL;

UPDATE "Initiative"
SET "clientTeamId" = NULL
WHERE COALESCE(BTRIM("originDirectorate"), '') = '';

DO $$
DECLARE
  unmapped_count INTEGER;
  cross_scope_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM "Initiative"
  WHERE COALESCE(BTRIM("originDirectorate"), '') <> ''
    AND "clientTeamId" IS NULL;

  IF unmapped_count > 0 THEN
    RAISE EXCEPTION 'Reconciliação abortada: % iniciativa(s) não mapeada(s)', unmapped_count;
  END IF;

  SELECT COUNT(*) INTO cross_scope_count
  FROM "Initiative" initiative
  JOIN "ClientTeam" team ON team."id" = initiative."clientTeamId"
  WHERE team."companyId" <> initiative."companyId"
     OR team."departmentId" <> initiative."departmentId";

  IF cross_scope_count > 0 THEN
    RAISE EXCEPTION 'Reconciliação abortada: % vínculo(s) fora do escopo', cross_scope_count;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Initiative_clientTeamId_idx" ON "Initiative"("clientTeamId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Initiative_clientTeamId_fkey'
  ) THEN
    ALTER TABLE "Initiative"
      ADD CONSTRAINT "Initiative_clientTeamId_fkey"
      FOREIGN KEY ("clientTeamId") REFERENCES "ClientTeam"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;

SELECT
  COUNT(*)::int AS "initiativeCount",
  COUNT("clientTeamId")::int AS "linkedCount",
  COUNT(*) FILTER (WHERE "clientTeamId" IS NULL)::int AS "withoutClientTeamCount"
FROM "Initiative";

SELECT COUNT(*)::int AS "clientTeamCount" FROM "ClientTeam";
