import type { Allocation } from '../../../domain/entities/Allocation.js';
import type { AllocationRepository } from '../../../domain/repositories/AllocationRepository.js';
import type { OracleService } from './oracle.service.js';

type Row = Record<string, unknown>;

export class OracleAllocationRepository implements AllocationRepository {
  constructor(private readonly oracle: OracleService) {}

  async listAllocations(): Promise<Allocation[]> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "companyId",
          "departmentId",
          "collaboratorId",
          "initiativeId",
          "systemId",
          "percentage",
          "startDate",
          "endDate"
        FROM "Allocation"
      `
    );

    return rows.map(row => ({
      id: String(row.id),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      collaboratorId: String(row.collaboratorId ?? ''),
      initiativeId: String(row.initiativeId ?? ''),
      systemId: row.systemId == null ? null : String(row.systemId),
      percentage: Number(row.percentage ?? 0),
      startDate: String(row.startDate ?? ''),
      endDate: String(row.endDate ?? '')
    }));
  }
}
