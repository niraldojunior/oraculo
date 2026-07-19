import { randomUUID } from 'node:crypto';
import type { ClientTeam, ClientTeamWriteData } from '../../../domain/entities/ClientTeam.js';
import type { ClientTeamRepository } from '../../../domain/repositories/ClientTeamRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleClientTeamRepository implements ClientTeamRepository {
  constructor(private readonly oracle: OracleService) {}

  async listClientTeams(scope: { companyId?: string; departmentId?: string }): Promise<ClientTeam[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          ct."id" AS "id",
          ct."name" AS "name",
          ct."companyId" AS "companyId",
          ct."departmentId" AS "departmentId",
          ct."businessUnitId" AS "businessUnitId",
          bu."name" AS "businessUnitName"
        FROM "ClientTeam" ct
        LEFT JOIN "BusinessUnit" bu ON bu."id" = ct."businessUnitId"
        WHERE (:companyId IS NULL OR ct."companyId" = :companyId)
          AND (:departmentId IS NULL OR ct."departmentId" = :departmentId)
        ORDER BY ct."name" ASC
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    return rows.map(row => this.mapRow(row));
  }

  async createClientTeam(data: ClientTeamWriteData): Promise<ClientTeam> {
    const id = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "ClientTeam" ("id", "name", "companyId", "departmentId", "businessUnitId")
        VALUES (:id, :name, :companyId, :departmentId, :businessUnitId)
      `,
      {
        id,
        name: data.name ?? '',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        businessUnitId: data.businessUnitId ?? null
      }
    );

    const created = await this.findClientTeamById(id);
    if (!created) throw new Error('ClientTeam not found after creation');
    return created;
  }

  async updateClientTeam(id: string, data: ClientTeamWriteData): Promise<ClientTeam> {
    const fields: string[] = [];
    const binds: Record<string, unknown> = { id };

    if (data.name !== undefined) {
      fields.push('"name" = :name');
      binds.name = data.name;
    }
    if (data.companyId !== undefined) {
      fields.push('"companyId" = :companyId');
      binds.companyId = data.companyId;
    }
    if (data.departmentId !== undefined) {
      fields.push('"departmentId" = :departmentId');
      binds.departmentId = data.departmentId;
    }
    if (data.businessUnitId !== undefined) {
      fields.push('"businessUnitId" = :businessUnitId');
      binds.businessUnitId = data.businessUnitId ?? null;
    }

    if (fields.length > 0) {
      await this.oracle.execute(
        `UPDATE "ClientTeam" SET ${fields.join(', ')} WHERE "id" = :id`,
        binds
      );
    }

    const updated = await this.findClientTeamById(id);
    if (!updated) throw new Error('ClientTeam not found after update');
    return updated;
  }

  async deleteClientTeam(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "ClientTeam" WHERE "id" = :id', { id });
  }

  async findClientTeamById(id: string): Promise<ClientTeam | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          ct."id" AS "id",
          ct."name" AS "name",
          ct."companyId" AS "companyId",
          ct."departmentId" AS "departmentId",
          ct."businessUnitId" AS "businessUnitId",
          bu."name" AS "businessUnitName"
        FROM "ClientTeam" ct
        LEFT JOIN "BusinessUnit" bu ON bu."id" = ct."businessUnitId"
        WHERE ct."id" = :id
      `,
      { id }
    );

    const first = rows[0];
    return first ? this.mapRow(first) : null;
  }

  private mapRow(row: Record<string, unknown>): ClientTeam {
    return {
      id: String(row.id),
      name: String(row.name ?? ''),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      businessUnitId: row.businessUnitId == null ? null : String(row.businessUnitId),
      businessUnitName: row.businessUnitName == null ? null : String(row.businessUnitName)
    };
  }
}
