import { randomUUID } from 'node:crypto';
import type {
  CollaboratorWriteData,
  OrganizationRepository,
  TeamWriteData
} from '../../domain/repositories/OrganizationRepository.js';
import type { OracleRuntime } from './oracle.runtime.js';

type Row = Record<string, unknown>;

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'y';
  }
  return false;
}

function toAssociatedCompanyIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v));
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(v => String(v));
      }
    } catch {
      return [];
    }
  }

  return [];
}

export class OracleOrganizationRepository implements OrganizationRepository {
  private readonly oracle: OracleRuntime;

  constructor(oracle: OracleRuntime) {
    this.oracle = oracle;
  }

  async listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<any[]> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "type",
          "parentTeamId",
          "leaderId",
          "receivesInitiatives"
        FROM "Team"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    return rows.map(row => ({
      ...row,
      receivesInitiatives: toBoolean(row.receivesInitiatives)
    }));
  }

  async listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    safeSelect: unknown;
    dashboardSelect: unknown;
  }): Promise<any[]> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "photoUrl",
          "email",
          "role",
          "teamId" AS "squadId",
          "phone",
          "bio",
          "linkedinUrl",
          "githubUrl",
          "isAdmin",
          "associatedCompanyIds",
          "vacationStart",
          "startDate",
          "endDate",
          "birthday",
          "uf"
        FROM "Collaborator"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      {
        companyId: params.scope.companyId ?? null,
        departmentId: params.scope.departmentId ?? null
      }
    );

    return rows.map(row => ({
      ...row,
      isAdmin: toBoolean(row.isAdmin),
      associatedCompanyIds: toAssociatedCompanyIds(row.associatedCompanyIds)
    }));
  }

  async findCollaboratorById(id: string): Promise<any | null> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "email",
          "role",
          "teamId" AS "squadId",
          "photoUrl",
          "phone",
          "bio",
          "linkedinUrl",
          "githubUrl",
          "password",
          "isAdmin",
          "vacationStart",
          "startDate",
          "endDate",
          "birthday",
          "uf",
          "associatedCompanyIds"
        FROM "Collaborator"
        WHERE "id" = :id
      `,
      { id }
    );

    const row = rows[0];
    if (!row) return null;

    return {
      ...row,
      isAdmin: toBoolean(row.isAdmin),
      associatedCompanyIds: toAssociatedCompanyIds(row.associatedCompanyIds)
    };
  }

  async findCollaboratorByEmail(email: string): Promise<any | null> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "name",
          "email",
          "role",
          "companyId",
          "departmentId",
          "photoUrl",
          "phone",
          "bio",
          "linkedinUrl",
          "githubUrl",
          "isAdmin",
          "teamId" AS "squadId",
          "associatedCompanyIds"
        FROM "Collaborator"
        WHERE LOWER("email") = :email
      `,
      { email: email.toLowerCase() }
    );

    const collaborator = rows[0];
    if (!collaborator) return null;

    const skills = await this.oracle.query<Row>(
      `
        SELECT
          "collaboratorId",
          "skillId"
        FROM "CollaboratorSkill"
        WHERE "collaboratorId" = :collaboratorId
      `,
      { collaboratorId: collaborator.id }
    );

    return {
      ...collaborator,
      isAdmin: toBoolean(collaborator.isAdmin),
      associatedCompanyIds: toAssociatedCompanyIds(collaborator.associatedCompanyIds),
      skills
    };
  }

  async createTeam(data: TeamWriteData): Promise<any> {
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Team" (
          "id",
          "companyId",
          "departmentId",
          "name",
          "type",
          "parentTeamId",
          "leaderId",
          "receivesInitiatives"
        ) VALUES (
          :id,
          :companyId,
          :departmentId,
          :name,
          :type,
          :parentTeamId,
          :leaderId,
          :receivesInitiatives
        )
      `,
      {
        id,
        companyId: data.companyId,
        departmentId: data.departmentId,
        name: data.name,
        type: data.type,
        parentTeamId: data.parentTeamId ?? null,
        leaderId: data.leaderId ?? null,
        receivesInitiatives: data.receivesInitiatives ? 1 : 0
      }
    );

    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "type",
          "parentTeamId",
          "leaderId",
          "receivesInitiatives"
        FROM "Team"
        WHERE "id" = :id
      `,
      { id }
    );

    const team = rows[0];
    return team
      ? {
          ...team,
          receivesInitiatives: toBoolean(team.receivesInitiatives)
        }
      : null;
  }

  async updateTeam(id: string, data: TeamWriteData): Promise<any> {
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
    if (data.type !== undefined) {
      fields.push('"type" = :type');
      binds.type = data.type;
    }
    if (data.parentTeamId !== undefined) {
      fields.push('"parentTeamId" = :parentTeamId');
      binds.parentTeamId = data.parentTeamId;
    }
    if (data.leaderId !== undefined) {
      fields.push('"leaderId" = :leaderId');
      binds.leaderId = data.leaderId;
    }
    if (data.receivesInitiatives !== undefined) {
      fields.push('"receivesInitiatives" = :receivesInitiatives');
      binds.receivesInitiatives = data.receivesInitiatives ? 1 : 0;
    }

    if (fields.length > 0) {
      await this.oracle.execute(
        `
          UPDATE "Team"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "type",
          "parentTeamId",
          "leaderId",
          "receivesInitiatives"
        FROM "Team"
        WHERE "id" = :id
      `,
      { id }
    );

    const team = rows[0];
    return team
      ? {
          ...team,
          receivesInitiatives: toBoolean(team.receivesInitiatives)
        }
      : null;
  }

  async deleteTeam(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Team" WHERE "id" = :id', { id });
  }

  async createCollaborator(data: CollaboratorWriteData): Promise<any> {
    const raw = data as Record<string, unknown>;
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Collaborator" (
          "id",
          "companyId",
          "departmentId",
          "name",
          "email",
          "role",
          "teamId",
          "photoUrl",
          "phone",
          "bio",
          "linkedinUrl",
          "githubUrl",
          "password",
          "isAdmin",
          "vacationStart",
          "startDate",
          "endDate",
          "birthday",
          "uf",
          "associatedCompanyIds"
        ) VALUES (
          :id,
          :companyId,
          :departmentId,
          :name,
          :email,
          :role,
          :teamId,
          :photoUrl,
          :phone,
          :bio,
          :linkedinUrl,
          :githubUrl,
          :password,
          :isAdmin,
          :vacationStart,
          :startDate,
          :endDate,
          :birthday,
          :uf,
          :associatedCompanyIds
        )
      `,
      {
        id,
        companyId: data.companyId,
        departmentId: data.departmentId,
        name: data.name,
        email: data.email,
        role: data.role,
        teamId: data.squadId ?? null,
        photoUrl: data.photoUrl ?? null,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        linkedinUrl: data.linkedinUrl ?? null,
        githubUrl: data.githubUrl ?? null,
        password: raw.password ?? '123456',
        isAdmin: data.isAdmin ? 1 : 0,
        vacationStart: data.vacationStart ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        birthday: data.birthday ?? null,
        uf: data.uf ?? null,
        associatedCompanyIds: JSON.stringify(data.associatedCompanyIds ?? [])
      }
    );

    return this.getCollaboratorWithRelations(id);
  }

  async updateCollaborator(id: string, data: CollaboratorWriteData): Promise<any> {
    const raw = data as Record<string, unknown>;
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
    if (data.email !== undefined) {
      fields.push('"email" = :email');
      binds.email = data.email;
    }
    if (data.role !== undefined) {
      fields.push('"role" = :role');
      binds.role = data.role;
    }
    if (data.squadId !== undefined) {
      fields.push('"teamId" = :teamId');
      binds.teamId = data.squadId;
    }
    if (data.photoUrl !== undefined) {
      fields.push('"photoUrl" = :photoUrl');
      binds.photoUrl = data.photoUrl;
    }
    if (data.phone !== undefined) {
      fields.push('"phone" = :phone');
      binds.phone = data.phone;
    }
    if (data.bio !== undefined) {
      fields.push('"bio" = :bio');
      binds.bio = data.bio;
    }
    if (data.linkedinUrl !== undefined) {
      fields.push('"linkedinUrl" = :linkedinUrl');
      binds.linkedinUrl = data.linkedinUrl;
    }
    if (data.githubUrl !== undefined) {
      fields.push('"githubUrl" = :githubUrl');
      binds.githubUrl = data.githubUrl;
    }
    if (raw.password !== undefined) {
      fields.push('"password" = :password');
      binds.password = raw.password;
    }
    if (data.isAdmin !== undefined) {
      fields.push('"isAdmin" = :isAdmin');
      binds.isAdmin = data.isAdmin ? 1 : 0;
    }
    if (data.vacationStart !== undefined) {
      fields.push('"vacationStart" = :vacationStart');
      binds.vacationStart = data.vacationStart;
    }
    if (data.startDate !== undefined) {
      fields.push('"startDate" = :startDate');
      binds.startDate = data.startDate;
    }
    if (data.endDate !== undefined) {
      fields.push('"endDate" = :endDate');
      binds.endDate = data.endDate;
    }
    if (data.birthday !== undefined) {
      fields.push('"birthday" = :birthday');
      binds.birthday = data.birthday;
    }
    if (data.uf !== undefined) {
      fields.push('"uf" = :uf');
      binds.uf = data.uf;
    }
    if (data.associatedCompanyIds !== undefined) {
      fields.push('"associatedCompanyIds" = :associatedCompanyIds');
      binds.associatedCompanyIds = JSON.stringify(data.associatedCompanyIds ?? []);
    }

    if (fields.length > 0) {
      await this.oracle.execute(
        `
          UPDATE "Collaborator"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    return this.getCollaboratorWithRelations(id);
  }

  async deleteCollaborator(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Collaborator" WHERE "id" = :id', { id });
  }

  async toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }): Promise<void> {
    const { collaboratorId, skillId, active } = params;

    if (active) {
      await this.oracle.execute(
        `
          MERGE INTO "CollaboratorSkill" target
          USING (SELECT :collaboratorId AS "collaboratorId", :skillId AS "skillId" FROM DUAL) src
          ON (target."collaboratorId" = src."collaboratorId" AND target."skillId" = src."skillId")
          WHEN NOT MATCHED THEN
            INSERT ("collaboratorId", "skillId") VALUES (src."collaboratorId", src."skillId")
        `,
        { collaboratorId, skillId }
      );
      return;
    }

    await this.oracle.execute(
      'DELETE FROM "CollaboratorSkill" WHERE "collaboratorId" = :collaboratorId AND "skillId" = :skillId',
      { collaboratorId, skillId }
    );
  }

  private async getCollaboratorWithRelations(id: string): Promise<any | null> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "name",
          "email",
          "role",
          "teamId" AS "squadId",
          "photoUrl",
          "phone",
          "bio",
          "linkedinUrl",
          "githubUrl",
          "password",
          "isAdmin",
          "vacationStart",
          "startDate",
          "endDate",
          "birthday",
          "uf",
          "associatedCompanyIds"
        FROM "Collaborator"
        WHERE "id" = :id
      `,
      { id }
    );

    const collaborator = rows[0];
    if (!collaborator) return null;

    const [absences, skills] = await Promise.all([
      this.oracle.query<Row>(
        `
          SELECT
            "id",
            "collaboratorId",
            "startDate",
            "endDate",
            "type",
            "reason"
          FROM "Absence"
          WHERE "collaboratorId" = :collaboratorId
        `,
        { collaboratorId: id }
      ),
      this.oracle.query<Row>(
        `
          SELECT
            cs."collaboratorId" AS "collaboratorId",
            cs."skillId" AS "skillId",
            s."id" AS "skill_id",
            s."name" AS "skill_name",
            s."description" AS "skill_description",
            s."familia" AS "skill_familia",
            s."icon" AS "skill_icon",
            s."companyId" AS "skill_companyId",
            s."departmentId" AS "skill_departmentId"
          FROM "CollaboratorSkill" cs
          INNER JOIN "Skill" s ON s."id" = cs."skillId"
          WHERE cs."collaboratorId" = :collaboratorId
        `,
        { collaboratorId: id }
      )
    ]);

    return {
      ...collaborator,
      isAdmin: toBoolean(collaborator.isAdmin),
      associatedCompanyIds: toAssociatedCompanyIds(collaborator.associatedCompanyIds),
      absences,
      skills: skills.map(row => ({
        collaboratorId: row.collaboratorId,
        skillId: row.skillId,
        skill: {
          id: row.skill_id,
          name: row.skill_name,
          description: row.skill_description,
          familia: row.skill_familia,
          icon: row.skill_icon,
          companyId: row.skill_companyId,
          departmentId: row.skill_departmentId
        }
      }))
    };
  }
}