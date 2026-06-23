import { randomUUID } from 'node:crypto';
import type { System, SystemWriteData } from '../../../domain/entities/System.js';
import type { SystemRepository } from '../../../domain/repositories/SystemRepository.js';
import type { OracleService } from './oracle.service.js';

type Row = Record<string, unknown>;

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (!value.trim()) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export class OracleSystemRepository implements SystemRepository {
  constructor(private readonly oracle: OracleService) {}

  async listSystems(scope: { companyId?: string; departmentId?: string }): Promise<System[]> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "category",
          "criticality",
          "ownerTeamId",
          "lifecycleStatus",
          "debtScore",
          "description",
          "environments",
          "contextFiles",
          "technicalSkills",
          "responsibleCollaborators"
        FROM "System"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    return rows.map(row => this.mapSystem(row));
  }

  async findSystemById(id: string): Promise<System | null> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "category",
          "criticality",
          "ownerTeamId",
          "lifecycleStatus",
          "debtScore",
          "description",
          "environments",
          "contextFiles",
          "technicalSkills",
          "responsibleCollaborators"
        FROM "System"
        WHERE "id" = :id
      `,
      { id }
    );

    const row = rows[0];
    return row ? this.mapSystem(row) : null;
  }

  async createSystem(data: SystemWriteData): Promise<System> {
    const id = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "System" (
          "id",
          "companyId",
          "departmentId",
          "name",
          "category",
          "criticality",
          "ownerTeamId",
          "lifecycleStatus",
          "debtScore",
          "description",
          "environments",
          "contextFiles",
          "technicalSkills",
          "responsibleCollaborators"
        ) VALUES (
          :id,
          :companyId,
          :departmentId,
          :name,
          :category,
          :criticality,
          :ownerTeamId,
          :lifecycleStatus,
          :debtScore,
          :description,
          :environments,
          :contextFiles,
          :technicalSkills,
          :responsibleCollaborators
        )
      `,
      {
        id,
        companyId: data.companyId,
        departmentId: data.departmentId,
        name: data.name,
        category: data.category ?? null,
        criticality: data.criticality,
        ownerTeamId: data.ownerTeamId ?? null,
        lifecycleStatus: data.lifecycleStatus,
        debtScore: data.debtScore ?? 0,
        description: data.description,
        environments: data.environments ? JSON.stringify(data.environments) : null,
        contextFiles: data.contextFiles ? JSON.stringify(data.contextFiles) : null,
        technicalSkills: data.technicalSkills ? JSON.stringify(data.technicalSkills) : null,
        responsibleCollaborators: data.responsibleCollaborators
          ? JSON.stringify(data.responsibleCollaborators)
          : null
      }
    );

    const created = await this.findSystemById(id);
    if (!created) throw new Error('System not found after creation');
    return created;
  }

  async updateSystem(id: string, data: SystemWriteData): Promise<System> {
    const fields: string[] = [];
    const binds: Record<string, unknown> = { id };

    if (data.companyId !== undefined) {
      fields.push('"companyId" = :companyId');
      binds.companyId = data.companyId;
    }
    if (data.departmentId !== undefined) {
      fields.push('"departmentId" = :departmentId');
      binds.departmentId = data.departmentId;
    }
    if (data.name !== undefined) {
      fields.push('"name" = :name');
      binds.name = data.name;
    }
    if (data.category !== undefined) {
      fields.push('"category" = :category');
      binds.category = data.category;
    }
    if (data.criticality !== undefined) {
      fields.push('"criticality" = :criticality');
      binds.criticality = data.criticality;
    }
    if (data.ownerTeamId !== undefined) {
      fields.push('"ownerTeamId" = :ownerTeamId');
      binds.ownerTeamId = data.ownerTeamId;
    }
    if (data.lifecycleStatus !== undefined) {
      fields.push('"lifecycleStatus" = :lifecycleStatus');
      binds.lifecycleStatus = data.lifecycleStatus;
    }
    if (data.debtScore !== undefined) {
      fields.push('"debtScore" = :debtScore');
      binds.debtScore = data.debtScore;
    }
    if (data.description !== undefined) {
      fields.push('"description" = :description');
      binds.description = data.description;
    }
    if (data.environments !== undefined) {
      fields.push('"environments" = :environments');
      binds.environments = data.environments ? JSON.stringify(data.environments) : null;
    }
    if (data.contextFiles !== undefined) {
      fields.push('"contextFiles" = :contextFiles');
      binds.contextFiles = data.contextFiles ? JSON.stringify(data.contextFiles) : null;
    }
    if (data.technicalSkills !== undefined) {
      fields.push('"technicalSkills" = :technicalSkills');
      binds.technicalSkills = data.technicalSkills ? JSON.stringify(data.technicalSkills) : null;
    }
    if (data.responsibleCollaborators !== undefined) {
      fields.push('"responsibleCollaborators" = :responsibleCollaborators');
      binds.responsibleCollaborators = data.responsibleCollaborators
        ? JSON.stringify(data.responsibleCollaborators)
        : null;
    }

    if (fields.length > 0) {
      await this.oracle.execute(
        `
          UPDATE "System"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    const updated = await this.findSystemById(id);
    if (!updated) throw new Error('System not found');
    return updated;
  }

  async deleteSystem(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "System" WHERE "id" = :id', { id });
  }

  private mapSystem(row: Row): System {
    return {
      id: String(row.id),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      name: String(row.name ?? ''),
      category: row.category == null ? null : String(row.category),
      criticality: String(row.criticality ?? ''),
      ownerTeamId: row.ownerTeamId == null ? null : String(row.ownerTeamId),
      lifecycleStatus: String(row.lifecycleStatus ?? ''),
      debtScore: Number(row.debtScore ?? 0),
      description: String(row.description ?? ''),
      environments: parseJsonValue(row.environments),
      contextFiles: parseJsonValue(row.contextFiles),
      technicalSkills: parseJsonValue(row.technicalSkills),
      responsibleCollaborators: parseJsonValue(row.responsibleCollaborators)
    };
  }
}
