import { randomUUID } from 'node:crypto';
import type { Contract, ContractWriteData } from '../../../domain/entities/Contract.js';
import type { ContractRepository } from '../../../domain/repositories/ContractRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleContractRepository implements ContractRepository {
  constructor(private readonly oracle: OracleService) {}

  async listContracts(scope: { companyId?: string; departmentId?: string }): Promise<Contract[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
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
      { companyId: scope.companyId ?? null, departmentId: scope.departmentId ?? null }
    );

    return rows.map(row => this.mapContract(row));
  }

  async createContract(data: ContractWriteData): Promise<Contract> {
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Contract" (
          "id", "companyId", "departmentId", "vendorId", "name", "number", "startDate", "endDate",
          "model", "annualCost", "description", "status", "systemId", "leaderId"
        ) VALUES (
          :id, :companyId, :departmentId, :vendorId, :name, :number, :startDate, :endDate,
          :model, :annualCost, :description, :status, :systemId, :leaderId
        )
      `,
      {
        id,
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        vendorId: data.vendorId ?? '',
        name: data.name ?? null,
        number: data.number ?? '',
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        model: data.model ?? '',
        annualCost: data.annualCost ?? 0,
        description: data.description ?? null,
        status: data.status ?? 'Ativo',
        systemId: data.systemId ?? null,
        leaderId: data.leaderId ?? null
      }
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Contract not found after creation');
    return created;
  }

  async updateContract(id: string, data: ContractWriteData): Promise<Contract> {
    const fields: string[] = [];
    const binds: Record<string, unknown> = { id };

    if (data.companyId !== undefined) { fields.push('"companyId" = :companyId'); binds.companyId = data.companyId; }
    if (data.departmentId !== undefined) { fields.push('"departmentId" = :departmentId'); binds.departmentId = data.departmentId; }
    if (data.vendorId !== undefined) { fields.push('"vendorId" = :vendorId'); binds.vendorId = data.vendorId; }
    if (data.name !== undefined) { fields.push('"name" = :name'); binds.name = data.name; }
    if (data.number !== undefined) { fields.push('"number" = :number'); binds.number = data.number; }
    if (data.startDate !== undefined) { fields.push('"startDate" = :startDate'); binds.startDate = data.startDate; }
    if (data.endDate !== undefined) { fields.push('"endDate" = :endDate'); binds.endDate = data.endDate; }
    if (data.model !== undefined) { fields.push('"model" = :model'); binds.model = data.model; }
    if (data.annualCost !== undefined) { fields.push('"annualCost" = :annualCost'); binds.annualCost = data.annualCost; }
    if (data.description !== undefined) { fields.push('"description" = :description'); binds.description = data.description; }
    if (data.status !== undefined) { fields.push('"status" = :status'); binds.status = data.status; }
    if (data.systemId !== undefined) { fields.push('"systemId" = :systemId'); binds.systemId = data.systemId; }
    if (data.leaderId !== undefined) { fields.push('"leaderId" = :leaderId'); binds.leaderId = data.leaderId; }

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

    const updated = await this.findById(id);
    if (!updated) throw new Error('Contract not found');
    return updated;
  }

  async deleteContract(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Contract" WHERE "id" = :id', { id });
  }

  private async findById(id: string): Promise<Contract | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          "id", "companyId", "departmentId", "vendorId", "name", "number", "startDate", "endDate",
          "model", "annualCost", "description", "status", "systemId", "leaderId"
        FROM "Contract"
        WHERE "id" = :id
      `,
      { id }
    );

    return rows[0] ? this.mapContract(rows[0]) : null;
  }

  private mapContract(row: Record<string, unknown>): Contract {
    return {
      id: String(row.id),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      vendorId: String(row.vendorId ?? ''),
      number: String(row.number ?? ''),
      startDate: String(row.startDate ?? ''),
      endDate: String(row.endDate ?? ''),
      model: String(row.model ?? ''),
      annualCost: Number(row.annualCost ?? 0),
      name: row.name == null ? null : String(row.name),
      description: row.description == null ? null : String(row.description),
      status: row.status == null ? 'Ativo' : String(row.status),
      systemId: row.systemId == null ? null : String(row.systemId),
      leaderId: row.leaderId == null ? null : String(row.leaderId)
    };
  }
}
