-- Contrato pós-deploy. Execute somente após a API/frontend usarem clientTeamId
-- e a auditoria confirmar zero iniciativas não vazias sem vínculo.

BEGIN;

DO $$
DECLARE
  unmapped_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM "Initiative"
  WHERE COALESCE(BTRIM("originDirectorate"), '') <> ''
    AND "clientTeamId" IS NULL;

  IF unmapped_count > 0 THEN
    RAISE EXCEPTION 'Contrato abortado: % iniciativa(s) ainda não reconciliada(s)', unmapped_count;
  END IF;
END $$;

ALTER TABLE "Initiative" DROP COLUMN IF EXISTS "originDirectorate";

COMMIT;
