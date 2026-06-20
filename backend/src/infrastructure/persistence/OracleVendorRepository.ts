import { randomUUID } from 'node:crypto';
import type { VendorRepository, VendorWriteData } from '../../domain/repositories/VendorRepository.js';
import type { OracleRuntime } from './oracle.runtime.js';

type Row = Record<string, unknown>;

export class OracleVendorRepository implements VendorRepository {
  private readonly oracle: OracleRuntime;

  constructor(oracle: OracleRuntime) {
    this.oracle = oracle;
  }

  async listVendors(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    vendorLiteSelect: unknown;
    vendorListOmit: unknown;
  }): Promise<any[]> {
    const { scope, lite } = params;

    if (lite) {
      return this.oracle.query<Row>(
        `
          SELECT
            "id",
            "companyId",
            "departmentId",
            "companyName",
            "taxId",
            "type",
            "directorId",
            "managerId"
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
    }

    return this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "companyName",
          "taxId",
          "type",
          "directorId",
          "managerId"
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
  }

  async getVendorsContext(params: {
    scope: { companyId?: string; departmentId?: string };
    collaboratorSafeSelect: unknown;
    vendorListOmit: unknown;
    systemListOmit: unknown;
    companyListOmit: unknown;
  }): Promise<{
    vendors: any[];
    contracts: any[];
    systems: any[];
    collaborators: any[];
    companies: any[];
    departments: any[];
  }> {
    const { scope } = params;

    const vendors = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "companyName",
          "taxId",
          "type",
          "directorId",
          "managerId"
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

    const contracts = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "vendorId",
          "name",
          "number",
          "startDate",
          "endDate",
          "model",
          "annualCost",
          "description",
          "status",
          "systemId",
          "leaderId"
        FROM "Contract"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    const systems = await this.oracle.query<Row>(
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

    const collaborators = await this.oracle.query<Row>(
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
          "endDate"
        FROM "Collaborator"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    const companies = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "fantasyName",
          "realName",
          "description"
        FROM "Company"
        WHERE (:companyId IS NULL OR "id" = :companyId)
      `,
      {
        companyId: scope.companyId ?? null
      }
    );

    const departments = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "name",
          "companyId",
          "masterUserId"
        FROM "Department"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
      `,
      {
        companyId: scope.companyId ?? null
      }
    );

    const contractsByVendor = new Map<string, any[]>();
    for (const contract of contracts) {
      const vendorId = String(contract.vendorId ?? '');
      if (!contractsByVendor.has(vendorId)) {
        contractsByVendor.set(vendorId, []);
      }
      contractsByVendor.get(vendorId)!.push(contract);
    }

    const vendorsWithContracts = vendors.map(vendor => ({
      ...vendor,
      contracts: contractsByVendor.get(String(vendor.id)) ?? []
    }));

    return {
      vendors: vendorsWithContracts,
      contracts,
      systems,
      collaborators,
      companies,
      departments
    };
  }

  async createVendor(data: VendorWriteData): Promise<any> {
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Vendor" (
          "id",
          "companyId",
          "departmentId",
          "companyName",
          "taxId",
          "type",
          "logoUrl",
          "directorId",
          "managerId"
        ) VALUES (
          :id,
          :companyId,
          :departmentId,
          :companyName,
          :taxId,
          :type,
          :logoUrl,
          :directorId,
          :managerId
        )
      `,
      {
        id,
        companyId: data.companyId,
        departmentId: data.departmentId,
        companyName: data.companyName,
        taxId: data.taxId,
        type: data.type,
        logoUrl: data.logoUrl ?? null,
        directorId: data.directorId ?? null,
        managerId: data.managerId ?? null
      }
    );

    return this.findVendorById(id);
  }

  async updateVendor(id: string, data: VendorWriteData): Promise<any> {
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
    if (data.companyName !== undefined) {
      fields.push('"companyName" = :companyName');
      binds.companyName = data.companyName;
    }
    if (data.taxId !== undefined) {
      fields.push('"taxId" = :taxId');
      binds.taxId = data.taxId;
    }
    if (data.type !== undefined) {
      fields.push('"type" = :type');
      binds.type = data.type;
    }
    if (data.logoUrl !== undefined) {
      fields.push('"logoUrl" = :logoUrl');
      binds.logoUrl = data.logoUrl;
    }
    if (data.directorId !== undefined) {
      fields.push('"directorId" = :directorId');
      binds.directorId = data.directorId;
    }
    if (data.managerId !== undefined) {
      fields.push('"managerId" = :managerId');
      binds.managerId = data.managerId;
    }

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

    return this.findVendorById(id);
  }

  async deleteVendor(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Vendor" WHERE "id" = :id', { id });
  }

  private async findVendorById(id: string): Promise<any | null> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "companyName",
          "taxId",
          "type",
          "logoUrl",
          "directorId",
          "managerId"
        FROM "Vendor"
        WHERE "id" = :id
      `,
      { id }
    );

    return rows[0] ?? null;
  }
}