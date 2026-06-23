import { randomUUID } from 'node:crypto';
import type {
  Department,
  DepartmentMasterUser,
  DepartmentWriteData
} from '../../../domain/entities/Department.js';
import type { DepartmentRepository } from '../../../domain/repositories/DepartmentRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleDepartmentRepository implements DepartmentRepository {
  constructor(private readonly oracle: OracleService) {}

  async listDepartments(): Promise<Department[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          "id",
          "name",
          "companyId",
          "masterUserId"
        FROM "Department"
      `
    );

    return rows.map(row => this.mapDepartment(row));
  }

  async updateDepartmentBasic(id: string, data: DepartmentWriteData): Promise<Department> {
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

    const department = await this.findDepartmentById(id);
    if (!department) throw new Error('Department not found');
    return department;
  }

  async createDepartmentWithMaster(params: {
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    const { departmentData, masterUser, masterUserId } = params;
    const departmentId = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "Department" ("id", "name", "companyId", "masterUserId")
        VALUES (:id, :name, :companyId, :masterUserId)
      `,
      {
        id: departmentId,
        name: departmentData.name ?? '',
        companyId: departmentData.companyId ?? '',
        masterUserId: null
      }
    );

    const companyId = departmentData.companyId ?? '';

    if (masterUserId) {
      await this.oracle.execute(
        `
          UPDATE "Collaborator"
          SET "role" = 'Master', "departmentId" = :departmentId, "companyId" = :companyId
          WHERE "id" = :masterUserId
        `,
        { departmentId, companyId, masterUserId }
      );

      await this.oracle.execute(
        'UPDATE "Department" SET "masterUserId" = :masterUserId WHERE "id" = :departmentId',
        { masterUserId, departmentId }
      );
    } else if (this.isMasterUser(masterUser)) {
      const newMasterId = randomUUID();
      await this.oracle.execute(
        `
          INSERT INTO "Collaborator" (
            "id", "companyId", "departmentId", "name", "email", "role", "password", "isAdmin", "photoUrl"
          ) VALUES (
            :id, :companyId, :departmentId, :name, :email, 'Master', :password, :isAdmin, :photoUrl
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
        { masterUserId: newMasterId, departmentId }
      );
    }

    const department = await this.findDepartmentById(departmentId);
    if (!department) throw new Error('Department not found after creation');
    return department;
  }

  async updateDepartmentWithMaster(params: {
    id: string;
    departmentData: DepartmentWriteData;
    masterUser?: DepartmentMasterUser;
    masterUserId?: string;
  }): Promise<Department> {
    const { id, departmentData, masterUser, masterUserId } = params;
    const updatedDept = await this.updateDepartmentBasic(id, departmentData);

    if (masterUserId) {
      await this.oracle.execute(
        'UPDATE "Collaborator" SET "role" = :nextRole WHERE "departmentId" = :departmentId AND "role" = :currentRole',
        { nextRole: 'Operacional', departmentId: id, currentRole: 'Master' }
      );

      await this.oracle.execute(
        `
          UPDATE "Collaborator"
          SET "role" = 'Master', "departmentId" = :departmentId, "companyId" = :companyId
          WHERE "id" = :masterUserId
        `,
        { departmentId: id, companyId: updatedDept.companyId, masterUserId }
      );

      await this.oracle.execute(
        'UPDATE "Department" SET "masterUserId" = :masterUserId WHERE "id" = :id',
        { masterUserId, id }
      );
    } else if (this.isMasterUser(masterUser)) {
      await this.oracle.execute(
        'UPDATE "Collaborator" SET "role" = :nextRole WHERE "departmentId" = :departmentId AND "role" = :currentRole',
        { nextRole: 'Operacional', departmentId: id, currentRole: 'Master' }
      );

      const newMasterId = randomUUID();
      await this.oracle.execute(
        `
          INSERT INTO "Collaborator" (
            "id", "companyId", "departmentId", "name", "email", "role", "password", "isAdmin", "photoUrl"
          ) VALUES (
            :id, :companyId, :departmentId, :name, :email, 'Master', :password, :isAdmin, :photoUrl
          )
        `,
        {
          id: newMasterId,
          companyId: updatedDept.companyId,
          departmentId: id,
          name: masterUser.name,
          email: masterUser.email,
          password: masterUser.password || '123456',
          isAdmin: 0,
          photoUrl: masterUser.photoUrl || null
        }
      );

      await this.oracle.execute(
        'UPDATE "Department" SET "masterUserId" = :masterUserId WHERE "id" = :id',
        { masterUserId: newMasterId, id }
      );
    }

    const department = await this.findDepartmentById(id);
    if (!department) throw new Error('Department not found after update');
    return department;
  }

  private async findDepartmentById(id: string): Promise<Department | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
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

    return rows[0] ? this.mapDepartment(rows[0]) : null;
  }

  private mapDepartment(row: Record<string, unknown>): Department {
    return {
      id: String(row.id),
      name: String(row.name ?? ''),
      companyId: String(row.companyId ?? ''),
      masterUserId: row.masterUserId == null ? null : String(row.masterUserId)
    };
  }

  private isMasterUser(value: unknown): value is DepartmentMasterUser {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.name === 'string' && typeof candidate.email === 'string';
  }
}
