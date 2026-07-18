import { randomUUID } from 'node:crypto';
import type { BusinessUnit, BusinessUnitWriteData } from '../../../domain/entities/BusinessUnit.js';
import type { BusinessUnitRepository } from '../../../domain/repositories/BusinessUnitRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleBusinessUnitRepository implements BusinessUnitRepository {
  constructor(private readonly oracle: OracleService) {}

  async listBusinessUnits(scope: { companyId?: string; departmentId?: string }): Promise<BusinessUnit[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          b."id" AS "id",
          b."name" AS "name",
          b."companyId" AS "companyId",
          b."departmentId" AS "departmentId"
        FROM "BusinessUnit" b
        WHERE (:companyId IS NULL OR b."companyId" = :companyId)
          AND (:departmentId IS NULL OR b."departmentId" = :departmentId)
        ORDER BY b."name" ASC
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    return rows.map(row => this.mapRow(row));
  }

  async createBusinessUnit(data: BusinessUnitWriteData): Promise<BusinessUnit> {
    const id = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "BusinessUnit" ("id", "name", "companyId", "departmentId")
        VALUES (:id, :name, :companyId, :departmentId)
      `,
      {
        id,
        name: data.name ?? '',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? ''
      }
    );

    const created = await this.findById(id);
    if (!created) throw new Error('BusinessUnit not found after creation');
    return created;
  }

  async updateBusinessUnit(id: string, data: BusinessUnitWriteData): Promise<BusinessUnit> {
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

    if (fields.length > 0) {
      await this.oracle.execute(
        `UPDATE "BusinessUnit" SET ${fields.join(', ')} WHERE "id" = :id`,
        binds
      );
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error('BusinessUnit not found after update');
    return updated;
  }

  async deleteBusinessUnit(id: string): Promise<void> {
    await this.oracle.execute(
      'UPDATE "ClientTeam" SET "businessUnitId" = NULL WHERE "businessUnitId" = :id',
      { id }
    );
    await this.oracle.execute('DELETE FROM "BusinessUnit" WHERE "id" = :id', { id });
  }

  private async findById(id: string): Promise<BusinessUnit | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          b."id" AS "id",
          b."name" AS "name",
          b."companyId" AS "companyId",
          b."departmentId" AS "departmentId"
        FROM "BusinessUnit" b
        WHERE b."id" = :id
      `,
      { id }
    );

    const first = rows[0];
    return first ? this.mapRow(first) : null;
  }

  private mapRow(row: Record<string, unknown>): BusinessUnit {
    return {
      id: String(row.id),
      name: String(row.name ?? ''),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? '')
    };
  }
}
