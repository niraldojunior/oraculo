import { randomUUID } from 'node:crypto';
import type { SkillRepository, SkillWriteData } from '../../domain/repositories/SkillRepository.js';
import type { OracleRuntime } from './oracle.runtime.js';

type SkillRow = Record<string, unknown>;

export class OracleSkillRepository implements SkillRepository {
  private readonly oracle: OracleRuntime;

  constructor(oracle: OracleRuntime) {
    this.oracle = oracle;
  }

  async listSkills(scope: { companyId?: string; departmentId?: string }): Promise<any[]> {
    const rows = await this.oracle.query<SkillRow>(
      `
        SELECT
          s."id" AS "s_id",
          s."name" AS "s_name",
          s."description" AS "s_description",
          s."familia" AS "s_familia",
          s."icon" AS "s_icon",
          s."companyId" AS "s_companyId",
          s."departmentId" AS "s_departmentId",
          c."id" AS "c_id",
          c."name" AS "c_name",
          c."photoUrl" AS "c_photoUrl",
          c."role" AS "c_role"
        FROM "Skill" s
        LEFT JOIN "CollaboratorSkill" cs ON cs."skillId" = s."id"
        LEFT JOIN "Collaborator" c ON c."id" = cs."collaboratorId"
        WHERE (:companyId IS NULL OR s."companyId" = :companyId)
          AND (:departmentId IS NULL OR s."departmentId" = :departmentId)
        ORDER BY s."name" ASC
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    return this.groupSkillRows(rows);
  }

  async createSkill(data: SkillWriteData, memberIds?: string[]): Promise<any> {
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Skill" (
          "id", "name", "description", "familia", "icon", "companyId", "departmentId"
        ) VALUES (
          :id, :name, :description, :familia, :icon, :companyId, :departmentId
        )
      `,
      {
        id,
        name: data.name,
        description: data.description,
        familia: data.familia ?? null,
        icon: data.icon ?? null,
        companyId: data.companyId,
        departmentId: data.departmentId
      }
    );

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      for (const collaboratorId of memberIds) {
        await this.oracle.execute(
          `
            INSERT INTO "CollaboratorSkill" ("collaboratorId", "skillId")
            VALUES (:collaboratorId, :skillId)
          `,
          { collaboratorId, skillId: id }
        );
      }
    }

    const created = await this.findSkillById(id);
    return created;
  }

  async updateSkill(id: string, data: SkillWriteData, memberIds?: string[]): Promise<any> {
    const fields: string[] = [];
    const binds: Record<string, unknown> = { id };

    if (data.name !== undefined) {
      fields.push('"name" = :name');
      binds.name = data.name;
    }

    if (data.description !== undefined) {
      fields.push('"description" = :description');
      binds.description = data.description;
    }

    if (data.familia !== undefined) {
      fields.push('"familia" = :familia');
      binds.familia = data.familia;
    }

    if (data.icon !== undefined) {
      fields.push('"icon" = :icon');
      binds.icon = data.icon;
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
        `
          UPDATE "Skill"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    await this.oracle.execute('DELETE FROM "CollaboratorSkill" WHERE "skillId" = :skillId', { skillId: id });

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      for (const collaboratorId of memberIds) {
        await this.oracle.execute(
          `
            INSERT INTO "CollaboratorSkill" ("collaboratorId", "skillId")
            VALUES (:collaboratorId, :skillId)
          `,
          { collaboratorId, skillId: id }
        );
      }
    }

    const updated = await this.findSkillById(id);
    return updated;
  }

  async deleteSkill(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "CollaboratorSkill" WHERE "skillId" = :skillId', { skillId: id });
    await this.oracle.execute('DELETE FROM "Skill" WHERE "id" = :id', { id });
  }

  private async findSkillById(id: string): Promise<any | null> {
    const rows = await this.oracle.query<SkillRow>(
      `
        SELECT
          s."id" AS "s_id",
          s."name" AS "s_name",
          s."description" AS "s_description",
          s."familia" AS "s_familia",
          s."icon" AS "s_icon",
          s."companyId" AS "s_companyId",
          s."departmentId" AS "s_departmentId",
          c."id" AS "c_id",
          c."name" AS "c_name",
          c."photoUrl" AS "c_photoUrl",
          c."role" AS "c_role"
        FROM "Skill" s
        LEFT JOIN "CollaboratorSkill" cs ON cs."skillId" = s."id"
        LEFT JOIN "Collaborator" c ON c."id" = cs."collaboratorId"
        WHERE s."id" = :id
      `,
      { id }
    );

    const grouped = this.groupSkillRows(rows);
    return grouped[0] ?? null;
  }

  private groupSkillRows(rows: SkillRow[]): any[] {
    const byId = new Map<string, any>();

    for (const row of rows) {
      const skillId = String(row.s_id);
      let skill = byId.get(skillId);
      if (!skill) {
        skill = {
          id: row.s_id,
          name: row.s_name,
          description: row.s_description,
          familia: row.s_familia,
          icon: row.s_icon,
          companyId: row.s_companyId,
          departmentId: row.s_departmentId,
          collaborators: []
        };
        byId.set(skillId, skill);
      }

      if (row.c_id) {
        skill.collaborators.push({
          collaborator: {
            id: row.c_id,
            name: row.c_name,
            photoUrl: row.c_photoUrl,
            role: row.c_role
          }
        });
      }
    }

    return Array.from(byId.values());
  }
}