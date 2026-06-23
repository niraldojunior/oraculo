import { randomUUID } from 'node:crypto';
import type { Collaborator, CollaboratorWriteData } from '../../../domain/entities/Collaborator.js';
import type { Team, TeamWriteData } from '../../../domain/entities/Team.js';
import type { OrganizationRepository } from '../../../domain/repositories/OrganizationRepository.js';
import type { OracleService } from './oracle.service.js';

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
    return value.map(item => String(item));
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item));
      }
    } catch {
      return [];
    }
  }

  return [];
}

export class OracleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly oracle: OracleService) {}

  async listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<Team[]> {
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

    return rows.map(row => this.mapTeam(row));
  }

  async listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
  }): Promise<Collaborator[]> {
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
          "isAdmin",
          "vacationStart",
          "startDate",
          "endDate",
          "birthday",
          "uf",
          "associatedCompanyIds"
        FROM "Collaborator"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      {
        companyId: params.scope.companyId ?? null,
        departmentId: params.scope.departmentId ?? null
      }
    );

    return rows.map(row => this.mapCollaborator(row));
  }

  async findCollaboratorById(id: string): Promise<Collaborator | null> {
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
    return row ? this.mapCollaborator(row) : null;
  }

  async findCollaboratorByEmail(email: string): Promise<Collaborator | null> {
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
          "isAdmin",
          "vacationStart",
          "startDate",
          "endDate",
          "birthday",
          "uf",
          "associatedCompanyIds"
        FROM "Collaborator"
        WHERE LOWER("email") = :email
      `,
      { email: email.toLowerCase() }
    );

    const row = rows[0];
    return row ? this.mapCollaborator(row) : null;
  }

  async createTeam(data: TeamWriteData): Promise<Team> {
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

    const created = await this.findTeamById(id);
    if (!created) throw new Error('Team not found after creation');
    return created;
  }

  async updateTeam(id: string, data: TeamWriteData): Promise<Team> {
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

    const updated = await this.findTeamById(id);
    if (!updated) throw new Error('Team not found');
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Team" WHERE "id" = :id', { id });
  }

  async createCollaborator(data: CollaboratorWriteData): Promise<Collaborator> {
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
          :squadId,
          :photoUrl,
          :phone,
          :bio,
          :linkedinUrl,
          :githubUrl,
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
        squadId: data.squadId ?? null,
        photoUrl: data.photoUrl ?? null,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        linkedinUrl: data.linkedinUrl ?? null,
        githubUrl: data.githubUrl ?? null,
        isAdmin: data.isAdmin ? 1 : 0,
        vacationStart: data.vacationStart ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        birthday: data.birthday ?? null,
        uf: data.uf ?? null,
        associatedCompanyIds: JSON.stringify(data.associatedCompanyIds ?? [])
      }
    );

    const created = await this.findCollaboratorById(id);
    if (!created) throw new Error('Collaborator not found after creation');
    return created;
  }

  async updateCollaborator(id: string, data: CollaboratorWriteData): Promise<Collaborator> {
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
      fields.push('"teamId" = :squadId');
      binds.squadId = data.squadId;
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
      binds.associatedCompanyIds = JSON.stringify(data.associatedCompanyIds);
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

    const updated = await this.findCollaboratorById(id);
    if (!updated) throw new Error('Collaborator not found');
    return updated;
  }

  async deleteCollaborator(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Collaborator" WHERE "id" = :id', { id });
  }

  async toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }): Promise<void> {
    if (params.active) {
      await this.oracle.execute(
        `
          MERGE INTO "CollaboratorSkill" target
          USING (
            SELECT :collaboratorId AS "collaboratorId", :skillId AS "skillId" FROM dual
          ) source
          ON (
            target."collaboratorId" = source."collaboratorId"
            AND target."skillId" = source."skillId"
          )
          WHEN NOT MATCHED THEN
            INSERT ("collaboratorId", "skillId")
            VALUES (source."collaboratorId", source."skillId")
        `,
        {
          collaboratorId: params.collaboratorId,
          skillId: params.skillId
        }
      );
      return;
    }

    await this.oracle.execute(
      `
        DELETE FROM "CollaboratorSkill"
        WHERE "collaboratorId" = :collaboratorId
          AND "skillId" = :skillId
      `,
      {
        collaboratorId: params.collaboratorId,
        skillId: params.skillId
      }
    );
  }

  private async findTeamById(id: string): Promise<Team | null> {
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

    const row = rows[0];
    return row ? this.mapTeam(row) : null;
  }

  private mapTeam(row: Row): Team {
    return {
      id: String(row.id),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      name: String(row.name ?? ''),
      type: String(row.type ?? ''),
      parentTeamId: row.parentTeamId == null ? null : String(row.parentTeamId),
      leaderId: row.leaderId == null ? null : String(row.leaderId),
      receivesInitiatives: toBoolean(row.receivesInitiatives)
    };
  }

  private mapCollaborator(row: Row): Collaborator {
    return {
      id: String(row.id),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      name: String(row.name ?? ''),
      email: String(row.email ?? ''),
      role: String(row.role ?? ''),
      squadId: row.squadId == null ? null : String(row.squadId),
      photoUrl: row.photoUrl == null ? null : String(row.photoUrl),
      phone: row.phone == null ? null : String(row.phone),
      bio: row.bio == null ? null : String(row.bio),
      linkedinUrl: row.linkedinUrl == null ? null : String(row.linkedinUrl),
      githubUrl: row.githubUrl == null ? null : String(row.githubUrl),
      isAdmin: toBoolean(row.isAdmin),
      vacationStart: row.vacationStart == null ? null : String(row.vacationStart),
      startDate: row.startDate == null ? null : String(row.startDate),
      endDate: row.endDate == null ? null : String(row.endDate),
      birthday: row.birthday == null ? null : String(row.birthday),
      uf: row.uf == null ? null : String(row.uf),
      associatedCompanyIds: toAssociatedCompanyIds(row.associatedCompanyIds)
    };
  }
}
