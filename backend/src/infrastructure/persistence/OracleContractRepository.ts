import { randomUUID } from 'node:crypto';
import type { ContractRepository, ContractWriteData } from '../../domain/repositories/ContractRepository.js';
import type { OracleRuntime } from './oracle.runtime.js';

type ContractRow = Record<string, unknown>;

export class OracleContractRepository implements ContractRepository {
  private readonly oracle: OracleRuntime;

  constructor(oracle: OracleRuntime) {
    this.oracle = oracle;
  }

  async listContracts(scope: { companyId?: string; departmentId?: string }): Promise<any[]> {
    return this.oracle.query<ContractRow>(
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
  }

  async createContract(data: ContractWriteData): Promise<any> {
    const raw = data as Record<string, unknown>;
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Contract" (
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
        ) VALUES (
          :id,
          :companyId,
          :departmentId,
          :vendorId,
          :name,
          :number,
          :startDate,
          :endDate,
          :model,
          :annualCost,
          :description,
          :status,
          :systemId,
          :leaderId
        )
      `,
      {
        id,
        companyId: data.companyId,
        departmentId: data.departmentId,
        vendorId: data.vendorId,
        name: raw.name ?? null,
        number: data.number,
        startDate: data.startDate,
        endDate: data.endDate,
        model: data.model,
        annualCost: data.annualCost,
        description: raw.description ?? null,
        status: raw.status ?? 'Ativo',
        systemId: raw.systemId ?? null,
        leaderId: raw.leaderId ?? null
      }
    );

    return this.findContractById(id);
  }

  async updateContract(id: string, data: ContractWriteData): Promise<any> {
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
    if (data.vendorId !== undefined) {
      fields.push('"vendorId" = :vendorId');
      binds.vendorId = data.vendorId;
    }
    if (raw.name !== undefined) {
      fields.push('"name" = :name');
      binds.name = raw.name;
    }
    if (data.number !== undefined) {
      fields.push('"number" = :number');
      binds.number = data.number;
    }
    if (data.startDate !== undefined) {
      fields.push('"startDate" = :startDate');
      binds.startDate = data.startDate;
    }
    if (data.endDate !== undefined) {
      fields.push('"endDate" = :endDate');
      binds.endDate = data.endDate;
    }
    if (data.model !== undefined) {
      fields.push('"model" = :model');
      binds.model = data.model;
    }
    if (data.annualCost !== undefined) {
      fields.push('"annualCost" = :annualCost');
      binds.annualCost = data.annualCost;
    }
    if (raw.description !== undefined) {
      fields.push('"description" = :description');
      binds.description = raw.description;
    }
    if (raw.status !== undefined) {
      fields.push('"status" = :status');
      binds.status = raw.status;
    }
    if (raw.systemId !== undefined) {
      fields.push('"systemId" = :systemId');
      binds.systemId = raw.systemId;
    }
    if (raw.leaderId !== undefined) {
      fields.push('"leaderId" = :leaderId');
      binds.leaderId = raw.leaderId;
    }

    if (fields.length > 0) {
      await this.oracle.execute(
        `
          UPDATE "Contract"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    return this.findContractById(id);
  }

  async deleteContract(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Contract" WHERE "id" = :id', { id });
  }

  private async findContractById(id: string): Promise<any | null> {
    const rows = await this.oracle.query<ContractRow>(
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
        WHERE "id" = :id
      `,
      { id }
    );

    return rows[0] ?? null;
  }
}