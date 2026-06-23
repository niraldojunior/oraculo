import { randomUUID } from 'node:crypto';
import type { Vendor, VendorContext, VendorWriteData } from '../../../domain/entities/Vendor.js';
import type { VendorRepository } from '../../../domain/repositories/VendorRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleVendorRepository implements VendorRepository {
  constructor(private readonly oracle: OracleService) {}

  async listVendors(scope: { companyId?: string; departmentId?: string }): Promise<Vendor[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          "id", "companyId", "departmentId", "companyName", "taxId", "type", "logoUrl", "directorId", "managerId"
        FROM "Vendor"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
        ORDER BY "companyName" ASC
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    return rows.map(row => this.mapVendor(row));
  }

  async getVendorsContext(scope: { companyId?: string; departmentId?: string }): Promise<VendorContext> {
    const vendors = await this.listVendors(scope);

    const contracts = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT *
        FROM "Contract"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      { companyId: scope.companyId ?? null, departmentId: scope.departmentId ?? null }
    );

    const systems = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT *
        FROM "System"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      { companyId: scope.companyId ?? null, departmentId: scope.departmentId ?? null }
    );

    const collaborators = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "companyId", "departmentId", "name", "email", "role", "photoUrl"
        FROM "Collaborator"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      { companyId: scope.companyId ?? null, departmentId: scope.departmentId ?? null }
    );

    const companies = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "fantasyName", "realName", "logo", "description"
        FROM "Company"
        WHERE (:companyId IS NULL OR "id" = :companyId)
      `,
      { companyId: scope.companyId ?? null }
    );

    const departments = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "name", "companyId", "masterUserId"
        FROM "Department"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
      `,
      { companyId: scope.companyId ?? null }
    );

    return {
      vendors,
      contracts: contracts as any,
      systems,
      collaborators,
      companies: companies as any,
      departments: departments as any
    };
  }

  async createVendor(data: VendorWriteData): Promise<Vendor> {
    const id = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "Vendor" (
          "id", "companyId", "departmentId", "companyName", "taxId", "type", "logoUrl", "directorId", "managerId"
        ) VALUES (
          :id, :companyId, :departmentId, :companyName, :taxId, :type, :logoUrl, :directorId, :managerId
        )
      `,
      {
        id,
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        companyName: data.companyName ?? '',
        taxId: data.taxId ?? '',
        type: data.type ?? '',
        logoUrl: data.logoUrl ?? null,
        directorId: data.directorId ?? null,
        managerId: data.managerId ?? null
      }
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Vendor not found after creation');
    return created;
  }

  async updateVendor(id: string, data: VendorWriteData): Promise<Vendor> {
    const fields: string[] = [];
    const binds: Record<string, unknown> = { id };

    if (data.companyId !== undefined) { fields.push('"companyId" = :companyId'); binds.companyId = data.companyId; }
    if (data.departmentId !== undefined) { fields.push('"departmentId" = :departmentId'); binds.departmentId = data.departmentId; }
    if (data.companyName !== undefined) { fields.push('"companyName" = :companyName'); binds.companyName = data.companyName; }
    if (data.taxId !== undefined) { fields.push('"taxId" = :taxId'); binds.taxId = data.taxId; }
    if (data.type !== undefined) { fields.push('"type" = :type'); binds.type = data.type; }
    if (data.logoUrl !== undefined) { fields.push('"logoUrl" = :logoUrl'); binds.logoUrl = data.logoUrl; }
    if (data.directorId !== undefined) { fields.push('"directorId" = :directorId'); binds.directorId = data.directorId; }
    if (data.managerId !== undefined) { fields.push('"managerId" = :managerId'); binds.managerId = data.managerId; }

    if (fields.length > 0) {
      await this.oracle.execute(
        `
          UPDATE "Vendor"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error('Vendor not found');
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Vendor" WHERE "id" = :id', { id });
  }

  private async findById(id: string): Promise<Vendor | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          "id", "companyId", "departmentId", "companyName", "taxId", "type", "logoUrl", "directorId", "managerId"
        FROM "Vendor"
        WHERE "id" = :id
      `,
      { id }
    );

    return rows[0] ? this.mapVendor(rows[0]) : null;
  }

  private mapVendor(row: Record<string, unknown>): Vendor {
    return {
      id: String(row.id),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      companyName: String(row.companyName ?? ''),
      taxId: String(row.taxId ?? ''),
      type: String(row.type ?? ''),
      logoUrl: row.logoUrl == null ? null : String(row.logoUrl),
      directorId: row.directorId == null ? null : String(row.directorId),
      managerId: row.managerId == null ? null : String(row.managerId)
    };
  }
}
