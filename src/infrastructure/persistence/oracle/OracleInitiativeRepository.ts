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

  private parseJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
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
      taskHistory: this.parseJsonArray(row.taskHistory),
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
    const status = (row.status != null ? String(row.status) : 'Backlog') as Initiative['status'];

    return {
      id: String(row.id),
      title: String(row.title ?? ''),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      type: row.type == null ? undefined : String(row.type),
      benefit: row.benefit == null ? undefined : String(row.benefit),
      benefitType: row.benefitType == null ? undefined : String(row.benefitType),
      scope: row.scope == null ? undefined : String(row.scope),
      customerOwner: row.customerOwner == null ? undefined : String(row.customerOwner),
      clientTeamId: row.clientTeamId == null ? null : String(row.clientTeamId),
      clientTeam: null,
      originDirectorate: undefined,
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

  private async hydrateClientTeams(initiatives: Initiative[]): Promise<void> {
    const ids = [...new Set(initiatives.map(item => item.clientTeamId).filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return;

    const bindNames = ids.map((_, index) => `:clientTeamId${index}`).join(', ');
    const binds = Object.fromEntries(ids.map((id, index) => [`clientTeamId${index}`, id]));
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT ct."id" AS "id", ct."name" AS "name", ct."companyId" AS "companyId",
               ct."departmentId" AS "departmentId", ct."businessUnitId" AS "businessUnitId",
               bu."name" AS "businessUnitName"
        FROM "ClientTeam" ct
        LEFT JOIN "BusinessUnit" bu ON bu."id" = ct."businessUnitId"
        WHERE ct."id" IN (${bindNames})
      `,
      binds
    );
    const byId = new Map(rows.map(row => [String(row.id), row]));
    for (const initiative of initiatives) {
      const row = initiative.clientTeamId ? byId.get(initiative.clientTeamId) : undefined;
      if (!row) continue;
      initiative.clientTeam = {
        id: String(row.id),
        name: String(row.name ?? ''),
        companyId: String(row.companyId ?? ''),
        departmentId: String(row.departmentId ?? ''),
        businessUnitId: row.businessUnitId == null ? null : String(row.businessUnitId),
        businessUnitName: row.businessUnitName == null ? null : String(row.businessUnitName)
      };
      initiative.originDirectorate = initiative.clientTeam.name;
    }
  }

  async listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "title", "companyId", "departmentId", "type", "benefit", "benefitType", "scope",
               "customerOwner", "clientTeamId", "leaderId", "technicalLeadId",
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
    await this.hydrateClientTeams(initiatives);
    const milestonesByInitiative = await this.fetchMilestonesForMany(initiatives.map(i => i.id));

    for (const initiative of initiatives) {
      initiative.milestones = milestonesByInitiative.get(initiative.id) ?? [];
    }

    return initiatives;
  }

  async findById(id: string): Promise<Initiative | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "title", "companyId", "departmentId", "type", "benefit", "benefitType", "scope",
               "customerOwner", "clientTeamId", "leaderId", "technicalLeadId",
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
    await this.hydrateClientTeams([initiative]);
    initiative.milestones = await this.fetchMilestones(id);
    const historyRows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT "id", "timestamp", "user", "action", "fromStatus", "toStatus", "notes", "initiativeId"
        FROM "InitiativeHistory"
        WHERE "initiativeId" = :id
        ORDER BY "timestamp" ASC
      `,
      { id }
    );
    initiative.history = historyRows.map(row => ({
      id: String(row.id),
      timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp ?? new Date().toISOString()),
      user: String(row.user ?? 'Usuário'),
      action: String(row.action ?? ''),
      fromStatus: row.fromStatus == null ? undefined : String(row.fromStatus),
      toStatus: row.toStatus == null ? undefined : String(row.toStatus),
      notes: row.notes == null ? undefined : String(row.notes)
    }));
    return initiative;
  }

  async save(initiative: Initiative): Promise<Initiative> {
    const historyEntries = Array.isArray(initiative.history) ? initiative.history : [];
    const milestones = Array.isArray(initiative.milestones) ? initiative.milestones : [];

    await this.oracle.execute(
      `
        UPDATE "Initiative"
        SET "title" = :title,
            "type" = :type,
            "benefit" = :benefit,
            "benefitType" = :benefitType,
            "scope" = :scope,
            "customerOwner" = :customerOwner,
            "clientTeamId" = :clientTeamId,
            "leaderId" = :leaderId,
            "technicalLeadId" = :technicalLeadId,
            "impactedSystemIds" = :impactedSystemIds,
            "requestDate" = :requestDate,
            "businessExpectationDate" = :businessExpectationDate,
            "status" = :status,
            "previousStatus" = :previousStatus,
            "executingTeamId" = :executingTeamId,
            "executingDirectorate" = :executingDirectorate,
            "rationale" = :rationale,
            "externalLinkType" = :externalLinkType,
            "externalLinkName" = :externalLinkName,
            "externalLinkUrl" = :externalLinkUrl,
            "macroScope" = :macroScope,
            "createdById" = :createdById,
            "assignedManagerId" = :assignedManagerId,
            "initiativeType" = :initiativeType,
            "priority" = :priority,
            "memberIds" = :memberIds,
            "startDate" = :startDate,
            "endDate" = :endDate,
            "actualEndDate" = :actualEndDate,
            "companyId" = :companyId,
            "departmentId" = :departmentId
        WHERE "id" = :id
      `,
      {
        id: initiative.id,
        title: initiative.title,
        type: initiative.type ?? 'General',
        benefit: initiative.benefit ?? 'N/A',
        benefitType: initiative.benefitType ?? null,
        scope: initiative.scope ?? 'N/A',
        customerOwner: initiative.customerOwner ?? 'N/A',
        clientTeamId: initiative.clientTeamId ?? null,
        leaderId: initiative.leaderId ?? null,
        technicalLeadId: initiative.technicalLeadId ?? null,
        impactedSystemIds: JSON.stringify(initiative.impactedSystemIds ?? []),
        requestDate: initiative.requestDate ?? null,
        businessExpectationDate: initiative.businessExpectationDate ?? null,
        status: initiative.status,
        previousStatus: initiative.previousStatus ?? null,
        executingTeamId: initiative.executingTeamId ?? null,
        executingDirectorate: initiative.executingDirectorate ?? null,
        rationale: initiative.rationale ?? null,
        externalLinkType: initiative.externalLinkType ?? null,
        externalLinkName: initiative.externalLinkName ?? null,
        externalLinkUrl: initiative.externalLinkUrl ?? null,
        macroScope: JSON.stringify(initiative.macroScope ?? []),
        createdById: initiative.createdById ?? null,
        assignedManagerId: initiative.assignedManagerId ?? null,
        initiativeType: initiative.initiativeType ?? null,
        priority: initiative.priority,
        memberIds: JSON.stringify(initiative.memberIds ?? []),
        startDate: initiative.startDate ?? null,
        endDate: initiative.endDate ?? null,
        actualEndDate: initiative.actualEndDate ?? null,
        companyId: initiative.companyId ?? 'default-company',
        departmentId: initiative.departmentId ?? 'default-department'
      }
    );

    await this.oracle.execute(
      `DELETE FROM "MilestoneTask" WHERE "milestoneId" IN (SELECT "id" FROM "InitiativeMilestone" WHERE "initiativeId" = :id)`,
      { id: initiative.id }
    );
    await this.oracle.execute(
      `DELETE FROM "InitiativeMilestone" WHERE "initiativeId" = :id`,
      { id: initiative.id }
    );
    await this.oracle.execute(
      `DELETE FROM "InitiativeHistory" WHERE "initiativeId" = :id`,
      { id: initiative.id }
    );

    for (let i = 0; i < historyEntries.length; i++) {
      const entry: any = historyEntries[i];
      await this.oracle.execute(
        `
          INSERT INTO "InitiativeHistory" (
            "id", "timestamp", "user", "action", "fromStatus", "toStatus", "notes", "initiativeId"
          ) VALUES (
            :id, :timestamp, :user, :action, :fromStatus, :toStatus, :notes, :initiativeId
          )
        `,
        {
          id: entry.id ?? randomUUID(),
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          user: entry.user ?? 'Usuário',
          action: entry.action ?? '',
          fromStatus: entry.fromStatus ?? null,
          toStatus: entry.toStatus ?? null,
          notes: entry.notes ?? null,
          initiativeId: initiative.id
        }
      );
    }

    for (let i = 0; i < milestones.length; i++) {
      const milestone: any = milestones[i];
      const milestoneId = milestone.id ?? randomUUID();
      await this.oracle.execute(
        `
          INSERT INTO "InitiativeMilestone" (
            "id", "name", "systemId", "baselineDate", "realDate", "description",
            "assignedEngineerId", "startDate", "order", "initiativeId"
          ) VALUES (
            :id, :name, :systemId, :baselineDate, :realDate, :description,
            :assignedEngineerId, :startDate, :order, :initiativeId
          )
        `,
        {
          id: milestoneId,
          name: milestone.name ?? '',
          systemId: milestone.systemId ?? '',
          baselineDate: milestone.baselineDate ?? '',
          realDate: milestone.realDate ?? null,
          description: milestone.description ?? null,
          assignedEngineerId: milestone.assignedEngineerId ?? null,
          startDate: milestone.startDate ?? null,
          order: typeof milestone.order === 'number' ? milestone.order : i,
          initiativeId: initiative.id
        }
      );

      if (Array.isArray(milestone.tasks)) {
        for (let taskIndex = 0; taskIndex < milestone.tasks.length; taskIndex++) {
          const task: any = milestone.tasks[taskIndex];
          await this.oracle.execute(
            `
              INSERT INTO "MilestoneTask" (
                "id", "name", "status", "type", "assigneeId", "systemId", "systemIds",
                "priority", "startDate", "targetDate", "notes", "taskHistory",
                "order", "milestoneId", "createdAt", "updatedAt"
              ) VALUES (
                :id, :name, :status, :type, :assigneeId, :systemId, :systemIds,
                :priority, :startDate, :targetDate, :notes, :taskHistory,
                :order, :milestoneId, :createdAt, :updatedAt
              )
            `,
            {
              id: task.id ?? randomUUID(),
              name: task.name ?? '',
              status: task.status ?? 'Backlog',
              type: task.type ?? null,
              assigneeId: task.assigneeId ?? null,
              systemId: task.systemId ?? null,
              systemIds: JSON.stringify(Array.isArray(task.systemIds) ? task.systemIds : []),
              priority: typeof task.priority === 'number' ? task.priority : null,
              startDate: task.startDate ?? null,
              targetDate: task.targetDate ?? null,
              notes: task.notes ?? null,
              taskHistory: JSON.stringify(Array.isArray(task.taskHistory) ? task.taskHistory : []),
              order: typeof task.order === 'number' ? task.order : taskIndex,
              milestoneId: milestoneId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );
        }
      }
    }

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
          "id", "companyId", "departmentId", "title", "type", "benefit", "benefitType", "scope",
          "customerOwner", "clientTeamId", "leaderId", "technicalLeadId", "createdById",
          "assignedManagerId", "initiativeType", "rationale", "requestDate",
          "businessExpectationDate", "startDate", "endDate", "impactedSystemIds",
          "createdAt", "status", "macroScope", "priority", "memberIds"
        ) VALUES (
          :id, :companyId, :departmentId, :title, :type, :benefit, :benefitType, :scope,
          :customerOwner, :clientTeamId, :leaderId, :technicalLeadId, :createdById,
          :assignedManagerId, :initiativeType, :rationale, :requestDate,
          :businessExpectationDate, :startDate, :endDate, :impactedSystemIds,
          :createdAt, :status, :macroScope, :priority, :memberIds
        )
      `,
      {
        id,
        companyId: payload.companyId ?? 'default-company',
        departmentId: payload.departmentId ?? 'default-department',
        title: payload.title,
        type: payload.type ?? 'General',
        benefit: payload.benefit ?? 'N/A',
        benefitType: payload.benefitType ?? null,
        scope: payload.scope ?? 'N/A',
        customerOwner: payload.customerOwner ?? 'N/A',
        clientTeamId: payload.clientTeamId ?? null,
        leaderId: payload.leaderId ?? null,
        technicalLeadId: payload.technicalLeadId ?? null,
        createdById: payload.createdById ?? null,
        assignedManagerId: payload.assignedManagerId ?? null,
        initiativeType: payload.initiativeType ?? null,
        rationale: payload.rationale ?? null,
        requestDate: payload.requestDate ?? null,
        businessExpectationDate: payload.businessExpectationDate ?? null,
        startDate: payload.startDate ?? null,
        endDate: payload.endDate ?? null,
        impactedSystemIds: JSON.stringify(payload.impactedSystemIds ?? []),
        createdAt: new Date(),
        status: payload.status,
        macroScope: JSON.stringify(payload.macroScope ?? []),
        priority: payload.priority,
        memberIds: JSON.stringify(payload.memberIds ?? [])
      }
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to load created initiative');
    }

    return created;
  }

  async delete(id: string): Promise<void> {
    await this.oracle.execute(
      `DELETE FROM "MilestoneTask" WHERE "milestoneId" IN (SELECT "id" FROM "InitiativeMilestone" WHERE "initiativeId" = :id)`,
      { id }
    );
    await this.oracle.execute(
      `DELETE FROM "InitiativeComment" WHERE "initiativeId" = :id`,
      { id }
    );
    await this.oracle.execute(
      `DELETE FROM "InitiativeHistory" WHERE "initiativeId" = :id`,
      { id }
    );
    await this.oracle.execute(
      `DELETE FROM "InitiativeMilestone" WHERE "initiativeId" = :id`,
      { id }
    );
    await this.oracle.execute(
      `DELETE FROM "Initiative" WHERE "id" = :id`,
      { id }
    );
  }

  async countByClientTeamId(clientTeamId: string): Promise<number> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      'SELECT COUNT(*) AS "count" FROM "Initiative" WHERE "clientTeamId" = :clientTeamId',
      { clientTeamId }
    );
    return Number(rows[0]?.count ?? 0);
  }
}
