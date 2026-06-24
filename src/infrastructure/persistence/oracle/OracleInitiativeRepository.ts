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

  private mapTaskToDomain(row: Record<string, unknown>): Record<string, unknown> {
    return {
      id: String(row.id),
      name: String(row.name ?? ''),
      status: String(row.status ?? 'Backlog'),
      type: row.type == null ? undefined : String(row.type),
      assigneeId: row.assigneeId == null ? undefined : String(row.assigneeId),
      systemId: row.systemId == null ? undefined : String(row.systemId),
      systemIds: this.parseStringArray(row.systemIds),
      priority: row.priority == null ? undefined : Number(row.priority),
      startDate: row.startDate == null ? undefined : String(row.startDate),
      targetDate: row.targetDate == null ? undefined : String(row.targetDate),
      notes: row.notes == null ? undefined : String(row.notes),
      taskHistory: this.parseStringArray(row.taskHistory),
      order: Number(row.order ?? 0),
      milestoneId: String(row.milestoneId),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt ?? new Date())),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(String(row.updatedAt ?? new Date()))
    };
  }

  private mapMilestoneToDomain(row: Record<string, unknown>, tasks: Record<string, unknown>[]): Record<string, unknown> {
    return {
      id: String(row.id),
      name: String(row.name ?? ''),
      systemId: String(row.systemId ?? ''),
      baselineDate: String(row.baselineDate ?? ''),
      realDate: row.realDate == null ? undefined : String(row.realDate),
      description: row.description == null ? undefined : String(row.description),
      assignedEngineerId: row.assignedEngineerId == null ? undefined : String(row.assignedEngineerId),
      startDate: row.startDate == null ? undefined : String(row.startDate),
      order: row.order == null ? undefined : Number(row.order),
      initiativeId: String(row.initiativeId),
      tasks
    };
  }

  private async fetchMilestones(initiativeId: string): Promise<unknown[]> {
    const map = await this.fetchMilestonesForMany([initiativeId]);
    return map.get(initiativeId) ?? [];
  }

  private async fetchMilestonesForMany(initiativeIds: string[]): Promise<Map<string, unknown[]>> {
    const result = new Map<string, unknown[]>(initiativeIds.map(id => [id, []]));
    if (initiativeIds.length === 0) return result;

    const idBindNames = initiativeIds.map((_, i) => `:iid${i}`).join(', ');
    const idBinds = Object.fromEntries(initiativeIds.map((id, i) => [`iid${i}`, id]));

    const milestoneRows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "name", "systemId", "baselineDate", "realDate", "description",
               "assignedEngineerId", "startDate", "order", "initiativeId"
        FROM "InitiativeMilestone"
        WHERE "initiativeId" IN (${idBindNames})
        ORDER BY "order" ASC NULLS LAST
      `,
      idBinds
    );

    if (milestoneRows.length === 0) return result;

    const milestoneIds = milestoneRows.map(m => String(m.id));
    const midBindNames = milestoneIds.map((_, i) => `:mid${i}`).join(', ');
    const midBinds = Object.fromEntries(milestoneIds.map((id, i) => [`mid${i}`, id]));

    const taskRows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT t."id", t."name", t."status", t."type", t."assigneeId", t."systemId",
               t."systemIds", t."priority", t."startDate", t."targetDate", t."notes",
               t."taskHistory", t."order", t."milestoneId", t."createdAt", t."updatedAt"
        FROM "MilestoneTask" t
        WHERE t."milestoneId" IN (${midBindNames})
        ORDER BY t."order" ASC
      `,
      midBinds
    );

    const tasksByMilestone = new Map<string, Record<string, unknown>[]>();
    for (const taskRow of taskRows) {
      const mid = String(taskRow.milestoneId);
      if (!tasksByMilestone.has(mid)) tasksByMilestone.set(mid, []);
      tasksByMilestone.get(mid)!.push(this.mapTaskToDomain(taskRow));
    }

    for (const m of milestoneRows) {
      const iid = String(m.initiativeId);
      const mapped = this.mapMilestoneToDomain(m, tasksByMilestone.get(String(m.id)) ?? []);
      result.get(iid)!.push(mapped);
    }

    return result;
  }

  private mapToDomain(row: Record<string, unknown>): Initiative {
    const statusRaw = String(row.status ?? 'Backlog');
    const status = (row.status != null ? String(row.status) : 'Backlog') as Initiative['status'];

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

    if (rows.length === 0) return [];

    const initiatives = rows.map(row => this.mapToDomain(row));
    const milestonesByInitiative = await this.fetchMilestonesForMany(initiatives.map(i => i.id));

    for (const initiative of initiatives) {
      initiative.milestones = milestonesByInitiative.get(initiative.id) ?? [];
    }

    return initiatives;
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

    if (!rows[0]) return null;

    const initiative = this.mapToDomain(rows[0]);
    initiative.milestones = await this.fetchMilestones(id);
    return initiative;
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