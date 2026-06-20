import { randomUUID } from 'node:crypto';
import type { DepartmentRepository, DepartmentWriteData } from '../../domain/repositories/DepartmentRepository.js';
import type { OracleRuntime } from './oracle.runtime.js';

type DepartmentRow = Record<string, unknown>;

export class OracleDepartmentRepository implements DepartmentRepository {
  private readonly oracle: OracleRuntime;

  constructor(oracle: OracleRuntime) {
    this.oracle = oracle;
  }

  async listDepartments(): Promise<any[]> {
    return this.oracle.query<DepartmentRow>(
      `
        SELECT
          "id",
          "name",
          "companyId",
          "masterUserId"
        FROM "Department"
      `
    );
  }

  async updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<any> {
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

    if (data.masterUserId !== undefined) {
      fields.push('"masterUserId" = :masterUserId');
      binds.masterUserId = data.masterUserId;
    }

    if (fields.length > 0) {
      await this.oracle.execute(
        `
          UPDATE "Department"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    return this.findDepartmentById(id);
  }

  async createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: unknown;
    masterUserId?: string;
  }): Promise<any> {
    const { departmentData, masterUser, masterUserId } = params;
    const departmentId = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "Department" ("id", "name", "companyId", "masterUserId")
        VALUES (:id, :name, :companyId, :masterUserId)
      `,
      {
        id: departmentId,
        name: departmentData.name,
        companyId: departmentData.companyId,
        masterUserId: null
      }
    );

    const companyId = departmentData.companyId;

    if (masterUserId) {
      await this.oracle.execute(
        `
          UPDATE "Collaborator"
          SET "role" = 'Master', "departmentId" = :departmentId, "companyId" = :companyId
          WHERE "id" = :masterUserId
        `,
        {
          departmentId,
          companyId,
          masterUserId
        }
      );

      await this.oracle.execute(
        'UPDATE "Department" SET "masterUserId" = :masterUserId WHERE "id" = :departmentId',
        {
          masterUserId,
          departmentId
        }
      );
    } else if (this.isValidMasterUser(masterUser)) {
      const newMasterId = randomUUID();

      await this.oracle.execute(
        `
          INSERT INTO "Collaborator" (
            "id",
            "companyId",
            "departmentId",
            "name",
            "email",
            "role",
            "password",
            "isAdmin",
            "photoUrl"
          ) VALUES (
            :id,
            :companyId,
            :departmentId,
            :name,
            :email,
            'Master',
            :password,
            :isAdmin,
            :photoUrl
          )
        `,
        {
          id: newMasterId,
          companyId,
          departmentId,
          name: masterUser.name,
          email: masterUser.email,
          password: masterUser.password || '123456',
          isAdmin: 0,
          photoUrl: masterUser.photoUrl || null
        }
      );

      await this.oracle.execute(
        'UPDATE "Department" SET "masterUserId" = :masterUserId WHERE "id" = :departmentId',
        {
          masterUserId: newMasterId,
          departmentId
        }
      );
    }

    return this.findDepartmentById(departmentId);
  }

  async updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: unknown;
    masterUserId?: string;
  }): Promise<any> {
    const { id, departmentData, masterUser, masterUserId } = params;

    const updatedDept = await this.updateDepartmentBasic(id, departmentData);

    if (masterUserId) {
      await this.oracle.execute(
        'UPDATE "Collaborator" SET "role" = :nextRole WHERE "departmentId" = :departmentId AND "role" = :currentRole',
        {
          nextRole: 'Operacional',
          departmentId: id,
          currentRole: 'Master'
        }
      );

      await this.oracle.execute(
        `
          UPDATE "Collaborator"
          SET "role" = 'Master', "departmentId" = :departmentId, "companyId" = :companyId
          WHERE "id" = :masterUserId
        `,
        {
          departmentId: id,
          companyId: updatedDept?.companyId,
          masterUserId
        }
      );

      await this.oracle.execute('UPDATE "Department" SET "masterUserId" = :masterUserId WHERE "id" = :id', {
        masterUserId,
        id
      });
    } else if (this.isValidMasterUser(masterUser)) {
      await this.oracle.execute(
        'UPDATE "Collaborator" SET "role" = :nextRole WHERE "departmentId" = :departmentId AND "role" = :currentRole',
        {
          nextRole: 'Operacional',
          departmentId: id,
          currentRole: 'Master'
        }
      );

      const newMasterId = randomUUID();

      await this.oracle.execute(
        `
          INSERT INTO "Collaborator" (
            "id",
            "companyId",
            "departmentId",
            "name",
            "email",
            "role",
            "password",
            "isAdmin",
            "photoUrl"
          ) VALUES (
            :id,
            :companyId,
            :departmentId,
            :name,
            :email,
            'Master',
            :password,
            :isAdmin,
            :photoUrl
          )
        `,
        {
          id: newMasterId,
          companyId: updatedDept?.companyId,
          departmentId: id,
          name: masterUser.name,
          email: masterUser.email,
          password: masterUser.password || '123456',
          isAdmin: 0,
          photoUrl: masterUser.photoUrl || null
        }
      );

      await this.oracle.execute('UPDATE "Department" SET "masterUserId" = :masterUserId WHERE "id" = :id', {
        masterUserId: newMasterId,
        id
      });
    }

    return this.findDepartmentById(id);
  }

  private async findDepartmentById(id: string): Promise<any | null> {
    const rows = await this.oracle.query<DepartmentRow>(
      `
        SELECT
          "id",
          "name",
          "companyId",
          "masterUserId"
        FROM "Department"
        WHERE "id" = :id
      `,
      { id }
    );

    return rows[0] ?? null;
  }

  private isValidMasterUser(masterUser: unknown): masterUser is {
    name: string;
    email: string;
    password?: string;
    photoUrl?: string;
  } {
    if (!masterUser || typeof masterUser !== 'object') {
      return false;
    }

    const candidate = masterUser as Record<string, unknown>;
    return Boolean(candidate.name && candidate.email);
  }
}