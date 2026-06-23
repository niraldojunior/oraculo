import { randomUUID } from 'node:crypto';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleInitiativeRepository implements InitiativeRepository {
  constructor(private readonly oracle: OracleService) {}

  private parseStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(item => String(item));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item));
        }
      } catch {
        // Keep compatibility with non-JSON values.
      }
    }

    return [];
  }

  private mapToDomain(row: Record<string, unknown>): Initiative {
    const statusRaw = String(row.status ?? 'Backlog');
    const status =
      statusRaw === 'Done' || statusRaw === 'In Progress' || statusRaw === 'Backlog'
        ? statusRaw
        : 'Backlog';

    return {
      id: String(row.id),
      title: String(row.title ?? ''),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      type: row.type == null ? undefined : String(row.type),
      benefit: row.benefit == null ? undefined : String(row.benefit),
      scope: row.scope == null ? undefined : String(row.scope),
      customerOwner: row.customerOwner == null ? undefined : String(row.customerOwner),
      originDirectorate: row.originDirectorate == null ? undefined : String(row.originDirectorate),
      leaderId: row.leaderId == null ? undefined : String(row.leaderId),
      technicalLeadId: row.technicalLeadId == null ? undefined : String(row.technicalLeadId),
      impactedSystemIds: this.parseStringArray(row.impactedSystemIds),
      macroScope: this.parseStringArray(row.macroScope),
      requestDate: row.requestDate == null ? undefined : String(row.requestDate),
      businessExpectationDate: row.businessExpectationDate == null ? undefined : String(row.businessExpectationDate),
      status,
      previousStatus: row.previousStatus == null ? undefined : String(row.previousStatus),
      executingTeamId: row.executingTeamId == null ? undefined : String(row.executingTeamId),
      executingDirectorate: row.executingDirectorate == null ? undefined : String(row.executingDirectorate),
      rationale: row.rationale == null ? undefined : String(row.rationale),
      externalLinkType: row.externalLinkType == null ? undefined : String(row.externalLinkType),
      externalLinkName: row.externalLinkName == null ? undefined : String(row.externalLinkName),
      externalLinkUrl: row.externalLinkUrl == null ? undefined : String(row.externalLinkUrl),
      createdById: row.createdById == null ? undefined : String(row.createdById),
      assignedManagerId: row.assignedManagerId == null ? undefined : String(row.assignedManagerId),
      initiativeType: row.initiativeType == null ? undefined : String(row.initiativeType),
      memberIds: this.parseStringArray(row.memberIds),
      startDate: row.startDate == null ? undefined : String(row.startDate),
      endDate: row.endDate == null ? undefined : String(row.endDate),
      actualEndDate: row.actualEndDate == null ? undefined : String(row.actualEndDate),
      priority: Number(row.priority ?? 0),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt ?? new Date()))
    };
  }

  async listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "title", "companyId", "departmentId", "type", "benefit", "scope",
               "customerOwner", "originDirectorate", "leaderId", "technicalLeadId",
               "impactedSystemIds", "macroScope", "requestDate", "businessExpectationDate",
               "status", "previousStatus", "executingTeamId", "executingDirectorate",
               "rationale", "externalLinkType", "externalLinkName", "externalLinkUrl",
               "createdById", "assignedManagerId", "initiativeType", "memberIds",
               "startDate", "endDate", "actualEndDate", "priority", "createdAt"
        FROM "Initiative"
        WHERE (:companyId IS NULL OR "companyId" = :companyId)
          AND (:departmentId IS NULL OR "departmentId" = :departmentId)
        ORDER BY "createdAt" DESC
      `,
      {
        companyId: scope.companyId ?? null,
        departmentId: scope.departmentId ?? null
      }
    );

    return rows.map(row => this.mapToDomain(row));
  }

  async findById(id: string): Promise<Initiative | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "title", "companyId", "departmentId", "type", "benefit", "scope",
               "customerOwner", "originDirectorate", "leaderId", "technicalLeadId",
               "impactedSystemIds", "macroScope", "requestDate", "businessExpectationDate",
               "status", "previousStatus", "executingTeamId", "executingDirectorate",
               "rationale", "externalLinkType", "externalLinkName", "externalLinkUrl",
               "createdById", "assignedManagerId", "initiativeType", "memberIds",
               "startDate", "endDate", "actualEndDate", "priority", "createdAt"
        FROM "Initiative"
        WHERE "id" = :id
      `,
      { id }
    );

    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async save(initiative: Initiative): Promise<Initiative> {
    await this.oracle.execute(
      `
        UPDATE "Initiative"
        SET "title" = :title,
            "status" = :status,
            "priority" = :priority,
            "companyId" = :companyId,
            "departmentId" = :departmentId
        WHERE "id" = :id
      `,
      {
        id: initiative.id,
        title: initiative.title,
        status: initiative.status,
        priority: initiative.priority,
        companyId: initiative.companyId ?? 'default-company',
        departmentId: initiative.departmentId ?? 'default-department'
      }
    );

    const updated = await this.findById(initiative.id);
    if (!updated) {
      throw new Error('Failed to load updated initiative');
    }

    return updated;
  }

  async create(payload: Omit<Initiative, 'id' | 'createdAt'>): Promise<Initiative> {
    const id = randomUUID();

    await this.oracle.execute(
      `
        INSERT INTO "Initiative" (
          "id", "companyId", "departmentId", "title", "type", "benefit", "scope",
          "customerOwner", "originDirectorate", "impactedSystemIds", "createdAt", "status",
          "macroScope", "priority", "memberIds"
        ) VALUES (
          :id, :companyId, :departmentId, :title, :type, :benefit, :scope,
          :customerOwner, :originDirectorate, :impactedSystemIds, :createdAt, :status,
          :macroScope, :priority, :memberIds
        )
      `,
      {
        id,
        companyId: payload.companyId ?? 'default-company',
        departmentId: payload.departmentId ?? 'default-department',
        title: payload.title,
        type: 'General',
        benefit: 'N/A',
        scope: 'N/A',
        customerOwner: 'N/A',
        originDirectorate: 'N/A',
        impactedSystemIds: '[]',
        createdAt: new Date(),
        status: payload.status,
        macroScope: '[]',
        priority: payload.priority,
        memberIds: '[]'
      }
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to load created initiative');
    }

    return created;
  }
}
