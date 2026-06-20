import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';

interface AbsencesControllerDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
}

export function createAbsencesController(deps: AbsencesControllerDeps) {
  const { prisma, oracle, provider } = deps;

  const getAbsences = async (req: any, res: any) => {
    const { companyId, departmentId, teamId } = req.query;
    try {
      if (prisma) {
        const absences = await prisma.absence.findMany({
          where: {
            collaborator: {
              companyId: companyId as string,
              departmentId: departmentId as string,
              squadId: teamId ? (teamId as string) : undefined
            }
          },
          include: { collaborator: true }
        });
        return res.json(absences);
      }

      if (!oracle) {
        return res.status(501).json({ error: `Absences are not implemented for DB_PROVIDER=${provider}` });
      }

      const rows = await oracle.query<Record<string, unknown>>(
        `
          SELECT
            a."id" AS "id",
            a."collaboratorId" AS "collaboratorId",
            a."startDate" AS "startDate",
            a."endDate" AS "endDate",
            a."type" AS "type",
            a."reason" AS "reason",
            c."id" AS "c_id",
            c."companyId" AS "c_companyId",
            c."departmentId" AS "c_departmentId",
            c."teamId" AS "c_teamId",
            c."name" AS "c_name",
            c."email" AS "c_email",
            c."role" AS "c_role"
          FROM "Absence" a
          INNER JOIN "Collaborator" c ON c."id" = a."collaboratorId"
          WHERE (:companyId IS NULL OR c."companyId" = :companyId)
            AND (:departmentId IS NULL OR c."departmentId" = :departmentId)
            AND (:teamId IS NULL OR c."teamId" = :teamId)
        `,
        {
          companyId: companyId ?? null,
          departmentId: departmentId ?? null,
          teamId: teamId ?? null
        }
      );

      const absences = rows.map(row => ({
        id: row.id,
        collaboratorId: row.collaboratorId,
        startDate: row.startDate,
        endDate: row.endDate,
        type: row.type,
        reason: row.reason,
        collaborator: {
          id: row.c_id,
          companyId: row.c_companyId,
          departmentId: row.c_departmentId,
          squadId: row.c_teamId,
          name: row.c_name,
          email: row.c_email,
          role: row.c_role
        }
      }));
      res.json(absences);
    } catch (error) {
      console.error('API Error /api/absences [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch absences' });
    }
  };

  const createAbsence = async (req: any, res: any) => {
    try {
      if (prisma) {
        const absence = await prisma.absence.create({
          data: req.body,
          include: { collaborator: true }
        });
        return res.json(absence);
      }

      if (!oracle) {
        return res.status(501).json({ error: `Absences are not implemented for DB_PROVIDER=${provider}` });
      }

      const id = randomUUID();
      await oracle.execute(
        `
          INSERT INTO "Absence" (
            "id", "collaboratorId", "startDate", "endDate", "type", "reason"
          ) VALUES (
            :id, :collaboratorId, :startDate, :endDate, :type, :reason
          )
        `,
        {
          id,
          collaboratorId: req.body?.collaboratorId,
          startDate: req.body?.startDate,
          endDate: req.body?.endDate,
          type: req.body?.type,
          reason: req.body?.reason ?? null
        }
      );

      const createdRows = await oracle.query<Record<string, unknown>>(
        `
          SELECT
            a."id" AS "id",
            a."collaboratorId" AS "collaboratorId",
            a."startDate" AS "startDate",
            a."endDate" AS "endDate",
            a."type" AS "type",
            a."reason" AS "reason",
            c."id" AS "c_id",
            c."companyId" AS "c_companyId",
            c."departmentId" AS "c_departmentId",
            c."teamId" AS "c_teamId",
            c."name" AS "c_name",
            c."email" AS "c_email",
            c."role" AS "c_role"
          FROM "Absence" a
          INNER JOIN "Collaborator" c ON c."id" = a."collaboratorId"
          WHERE a."id" = :id
        `,
        { id }
      );

      const row = createdRows[0];
      const absence = row
        ? {
            id: row.id,
            collaboratorId: row.collaboratorId,
            startDate: row.startDate,
            endDate: row.endDate,
            type: row.type,
            reason: row.reason,
            collaborator: {
              id: row.c_id,
              companyId: row.c_companyId,
              departmentId: row.c_departmentId,
              squadId: row.c_teamId,
              name: row.c_name,
              email: row.c_email,
              role: row.c_role
            }
          }
        : null;

      res.json(absence);
    } catch (error) {
      console.error('API Error /api/absences [POST]:', error);
      res.status(500).json({ error: 'Failed to create absence' });
    }
  };

  const deleteAbsence = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      if (prisma) {
        await prisma.absence.delete({ where: { id } });
        return res.json({ message: 'Absence deleted' });
      }

      if (!oracle) {
        return res.status(501).json({ error: `Absences are not implemented for DB_PROVIDER=${provider}` });
      }

      await oracle.execute('DELETE FROM "Absence" WHERE "id" = :id', { id });
      res.json({ message: 'Absence deleted' });
    } catch (error) {
      console.error('API Error /api/absences/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete absence' });
    }
  };

  return {
    getAbsences,
    createAbsence,
    deleteAbsence
  };
}
