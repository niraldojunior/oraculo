import { randomUUID } from 'node:crypto';
import type { Skill, SkillWriteData } from '../../../domain/entities/Skill.js';
import type { SkillRepository } from '../../../domain/repositories/SkillRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleSkillRepository implements SkillRepository {
  constructor(private readonly oracle: OracleService) {}

  async listSkills(scope: { companyId?: string; departmentId?: string }): Promise<Skill[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
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

  async createSkill(data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
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
        name: data.name ?? '',
        description: data.description ?? '',
        familia: data.familia ?? null,
        icon: data.icon ?? null,
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? ''
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
    if (!created) throw new Error('Skill not found after creation');
    return created;
  }

  async updateSkill(id: string, data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
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
    if (!updated) throw new Error('Skill not found after update');
    return updated;
  }

  async deleteSkill(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "CollaboratorSkill" WHERE "skillId" = :skillId', { skillId: id });
    await this.oracle.execute('DELETE FROM "Skill" WHERE "id" = :id', { id });
  }

  private async findSkillById(id: string): Promise<Skill | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
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

  private groupSkillRows(rows: Record<string, unknown>[]): Skill[] {
    const byId = new Map<string, Skill>();

    for (const row of rows) {
      const skillId = String(row.s_id);
      let skill = byId.get(skillId);
      if (!skill) {
        skill = {
          id: skillId,
          name: String(row.s_name ?? ''),
          description: String(row.s_description ?? ''),
          familia: row.s_familia == null ? null : String(row.s_familia),
          icon: row.s_icon == null ? null : String(row.s_icon),
          companyId: String(row.s_companyId ?? ''),
          departmentId: String(row.s_departmentId ?? ''),
          collaborators: []
        };
        byId.set(skillId, skill);
      }

      if (row.c_id) {
        skill.collaborators?.push({
          collaborator: {
            id: String(row.c_id),
            name: String(row.c_name ?? ''),
            photoUrl: row.c_photoUrl == null ? null : String(row.c_photoUrl),
            role: String(row.c_role ?? '')
          }
        });
      }
    }

    return Array.from(byId.values());
  }
}
