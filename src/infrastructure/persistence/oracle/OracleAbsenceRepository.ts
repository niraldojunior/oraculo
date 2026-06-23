import { randomUUID } from 'node:crypto';
import type { Absence, AbsenceWriteData } from '../../../domain/entities/Absence.js';
import type { AbsenceRepository } from '../../../domain/repositories/AbsenceRepository.js';
import type { OracleService } from './oracle.service.js';

type Row = Record<string, unknown>;

export class OracleAbsenceRepository implements AbsenceRepository {
  constructor(private readonly oracle: OracleService) {}

  async listAbsences(scope: {
    companyId?: string;
    departmentId?: string;
    teamId?: string;
  }): Promise<Absence[]> {
    const rows = await this.oracle.query<Row>(
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
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null,
        teamId: scope.teamId ?? null
      }
    );

    return rows.map(row => ({
      id: String(row.id),
      collaboratorId: String(row.collaboratorId),
      startDate: String(row.startDate ?? ''),
      endDate: String(row.endDate ?? ''),
      type: String(row.type ?? ''),
      reason: row.reason == null ? null : String(row.reason),
      collaborator: {
        id: String(row.c_id),
        companyId: String(row.c_companyId ?? ''),
        departmentId: String(row.c_departmentId ?? ''),
        squadId: row.c_teamId == null ? null : String(row.c_teamId),
        name: String(row.c_name ?? ''),
        email: String(row.c_email ?? ''),
        role: String(row.c_role ?? '')
      }
    }));
  }

  async createAbsence(data: AbsenceWriteData): Promise<Absence> {
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Absence" (
          "id", "collaboratorId", "startDate", "endDate", "type", "reason"
        ) VALUES (
          :id, :collaboratorId, :startDate, :endDate, :type, :reason
        )
      `,
      {
        id,
        collaboratorId: data.collaboratorId,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        reason: data.reason ?? null
      }
    );

    const rows = await this.oracle.query<Row>(
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

    const row = rows[0];
    if (!row) throw new Error('Absence not found after creation');

    return {
      id: String(row.id),
      collaboratorId: String(row.collaboratorId),
      startDate: String(row.startDate ?? ''),
      endDate: String(row.endDate ?? ''),
      type: String(row.type ?? ''),
      reason: row.reason == null ? null : String(row.reason),
      collaborator: {
        id: String(row.c_id),
        companyId: String(row.c_companyId ?? ''),
        departmentId: String(row.c_departmentId ?? ''),
        squadId: row.c_teamId == null ? null : String(row.c_teamId),
        name: String(row.c_name ?? ''),
        email: String(row.c_email ?? ''),
        role: String(row.c_role ?? '')
      }
    };
  }

  async deleteAbsence(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Absence" WHERE "id" = :id', { id });
  }
}
