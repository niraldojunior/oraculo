import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';

export class PrismaInitiativeRepository implements InitiativeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private normalizeJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private mapTask(row: {
    id: string;
    name: string;
    status: string;
    type: string | null;
    assigneeId: string | null;
    systemId: string | null;
    systemIds: unknown;
    priority: number | null;
    startDate: string | null;
    targetDate: string | null;
    notes: string | null;
    taskHistory: unknown;
    order: number;
    milestoneId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Record<string, unknown> {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      type: row.type ?? undefined,
      assigneeId: row.assigneeId ?? undefined,
      systemId: row.systemId ?? undefined,
      systemIds: this.normalizeJsonArray(row.systemIds),
      priority: row.priority ?? undefined,
      startDate: row.startDate ?? undefined,
      targetDate: row.targetDate ?? undefined,
      notes: row.notes ?? undefined,
      taskHistory: this.normalizeJsonArray(row.taskHistory),
      order: row.order,
      milestoneId: row.milestoneId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  private mapMilestone(row: {
    id: string;
    name: string;
    systemId: string;
    baselineDate: string;
    realDate: string | null;
    description: string | null;
    assignedEngineerId: string | null;
    startDate: string | null;
    order: number | null;
    initiativeId: string;
  }, tasks: Record<string, unknown>[]): Record<string, unknown> {
    return {
      id: row.id,
      name: row.name,
      systemId: row.systemId,
      baselineDate: row.baselineDate,
      realDate: row.realDate ?? undefined,
      description: row.description ?? undefined,
      assignedEngineerId: row.assignedEngineerId ?? undefined,
      startDate: row.startDate ?? undefined,
      order: row.order ?? undefined,
      initiativeId: row.initiativeId,
      tasks
    };
  }

  private mapHistory(row: {
    id: string;
    timestamp: Date;
    user: string;
    action: string;
    fromStatus: string | null;
    toStatus: string | null;
    notes: string | null;
    initiativeId: string;
  }): Record<string, unknown> {
    return {
      id: row.id,
      timestamp: row.timestamp.toISOString(),
      user: row.user,
      action: row.action,
      fromStatus: row.fromStatus ?? undefined,
      toStatus: row.toStatus ?? undefined,
      notes: row.notes ?? undefined,
      initiativeId: row.initiativeId
    };
  }

  private mapToDomain(row: {
    id: string;
    title: string;
    companyId: string;
    departmentId: string;
    type: string;
    benefit: string;
    benefitType: string | null;
    scope: string;
    customerOwner: string;
    clientTeamId: string | null;
    clientTeam: {
      id: string;
      name: string;
      companyId: string;
      departmentId: string;
      businessUnitId: string | null;
      businessUnit: { name: string } | null;
    } | null;
    leaderId: string | null;
    technicalLeadId: string | null;
    impactedSystemIds: string[];
    macroScope: string[];
    requestDate: string | null;
    businessExpectationDate: string | null;
    status: string;
    previousStatus: string | null;
    executingTeamId: string | null;
    executingDirectorate: string | null;
    rationale: string | null;
    externalLinkType: string | null;
    externalLinkName: string | null;
    externalLinkUrl: string | null;
    createdById: string | null;
    assignedManagerId: string | null;
    initiativeType: string | null;
    memberIds: string[];
    startDate: string | null;
    endDate: string | null;
    actualEndDate: string | null;
    priority: number;
    createdAt: Date;
  }): Initiative {
    const normalizedStatus = (row.status ?? 'Backlog') as Initiative['status'];

    return {
      id: row.id,
      title: row.title,
      companyId: row.companyId,
      departmentId: row.departmentId,
      type: row.type,
      benefit: row.benefit,
      benefitType: row.benefitType ?? undefined,
      scope: row.scope,
      customerOwner: row.customerOwner,
      clientTeamId: row.clientTeamId,
      clientTeam: row.clientTeam ? {
        id: row.clientTeam.id,
        name: row.clientTeam.name,
        companyId: row.clientTeam.companyId,
        departmentId: row.clientTeam.departmentId,
        businessUnitId: row.clientTeam.businessUnitId,
        businessUnitName: row.clientTeam.businessUnit?.name ?? null
      } : null,
      originDirectorate: row.clientTeam?.name,
      leaderId: row.leaderId ?? undefined,
      technicalLeadId: row.technicalLeadId ?? undefined,
      impactedSystemIds: Array.isArray(row.impactedSystemIds) ? row.impactedSystemIds : [],
      macroScope: Array.isArray(row.macroScope) ? row.macroScope : [],
      requestDate: row.requestDate ?? undefined,
      businessExpectationDate: row.businessExpectationDate ?? undefined,
      status: normalizedStatus,
      previousStatus: row.previousStatus ?? undefined,
      executingTeamId: row.executingTeamId ?? undefined,
      executingDirectorate: row.executingDirectorate ?? undefined,
      rationale: row.rationale ?? undefined,
      externalLinkType: row.externalLinkType ?? undefined,
      externalLinkName: row.externalLinkName ?? undefined,
      externalLinkUrl: row.externalLinkUrl ?? undefined,
      createdById: row.createdById ?? undefined,
      assignedManagerId: row.assignedManagerId ?? undefined,
      initiativeType: row.initiativeType ?? undefined,
      memberIds: Array.isArray(row.memberIds) ? row.memberIds : [],
      startDate: row.startDate ?? undefined,
      endDate: row.endDate ?? undefined,
      actualEndDate: row.actualEndDate ?? undefined,
      priority: row.priority,
      createdAt: row.createdAt
    };
  }

  async listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    const rows = await this.prisma.initiative.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      },
      select: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        type: true,
        benefit: true,
        benefitType: true,
        scope: true,
        customerOwner: true,
        clientTeamId: true,
        clientTeam: {
          select: {
            id: true, name: true, companyId: true, departmentId: true, businessUnitId: true,
            businessUnit: { select: { name: true } }
          }
        },
        leaderId: true,
        technicalLeadId: true,
        impactedSystemIds: true,
        macroScope: true,
        requestDate: true,
        businessExpectationDate: true,
        status: true,
        previousStatus: true,
        executingTeamId: true,
        executingDirectorate: true,
        rationale: true,
        externalLinkType: true,
        externalLinkName: true,
        externalLinkUrl: true,
        createdById: true,
        assignedManagerId: true,
        initiativeType: true,
        memberIds: true,
        startDate: true,
        endDate: true,
        actualEndDate: true,
        priority: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return rows.map(row => this.mapToDomain(row));
  }

  async findById(id: string): Promise<Initiative | null> {
    const row = await this.prisma.initiative.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        type: true,
        benefit: true,
        benefitType: true,
        scope: true,
        customerOwner: true,
        clientTeamId: true,
        clientTeam: {
          select: {
            id: true, name: true, companyId: true, departmentId: true, businessUnitId: true,
            businessUnit: { select: { name: true } }
          }
        },
        leaderId: true,
        technicalLeadId: true,
        impactedSystemIds: true,
        macroScope: true,
        requestDate: true,
        businessExpectationDate: true,
        status: true,
        previousStatus: true,
        executingTeamId: true,
        executingDirectorate: true,
        rationale: true,
        externalLinkType: true,
        externalLinkName: true,
        externalLinkUrl: true,
        createdById: true,
        assignedManagerId: true,
        initiativeType: true,
        memberIds: true,
        startDate: true,
        endDate: true,
        actualEndDate: true,
        priority: true,
        createdAt: true
      }
    });

    if (!row) return null;

    const [historyRows, milestones] = await Promise.all([
      this.prisma.initiativeHistory.findMany({
        where: { initiativeId: id },
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          timestamp: true,
          user: true,
          action: true,
          fromStatus: true,
          toStatus: true,
          notes: true,
          initiativeId: true
        }
      }),
      this.prisma.initiativeMilestone.findMany({
        where: { initiativeId: id },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          systemId: true,
          baselineDate: true,
          realDate: true,
          description: true,
          assignedEngineerId: true,
          startDate: true,
          order: true,
          initiativeId: true,
          tasks: {
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              name: true,
              status: true,
              type: true,
              assigneeId: true,
              systemId: true,
              systemIds: true,
              priority: true,
              startDate: true,
              targetDate: true,
              notes: true,
              taskHistory: true,
              order: true,
              milestoneId: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })
    ]);

    return {
      ...this.mapToDomain(row),
      history: historyRows.map(h => this.mapHistory(h)),
      milestones: milestones.map(m => this.mapMilestone(m, m.tasks.map(t => this.mapTask(t))))
    };
  }

  async save(initiative: Initiative): Promise<Initiative> {
    const historyEntries = Array.isArray(initiative.history) ? initiative.history : null;
    const milestones = Array.isArray(initiative.milestones) ? initiative.milestones : null;

    await this.prisma.$transaction(async tx => {
      const updated = await tx.initiative.update({
        where: { id: initiative.id },
        data: {
          title: initiative.title,
          type: initiative.type ?? 'General',
          benefit: initiative.benefit ?? 'N/A',
          benefitType: initiative.benefitType ?? null,
          scope: initiative.scope ?? 'N/A',
          customerOwner: initiative.customerOwner ?? 'N/A',
          clientTeamId: initiative.clientTeamId ?? null,
          leaderId: initiative.leaderId ?? null,
          technicalLeadId: initiative.technicalLeadId ?? null,
          impactedSystemIds: initiative.impactedSystemIds ?? [],
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
          macroScope: initiative.macroScope ?? [],
          createdById: initiative.createdById ?? null,
          assignedManagerId: initiative.assignedManagerId ?? null,
          initiativeType: initiative.initiativeType ?? null,
          priority: initiative.priority,
          memberIds: initiative.memberIds ?? [],
          startDate: initiative.startDate ?? null,
          endDate: initiative.endDate ?? null,
          actualEndDate: initiative.actualEndDate ?? null,
          companyId: initiative.companyId ?? 'default-company',
          departmentId: initiative.departmentId ?? 'default-department'
        },
        select: {
          id: true,
          title: true,
          companyId: true,
          departmentId: true,
          type: true,
          benefit: true,
          benefitType: true,
          scope: true,
          customerOwner: true,
          clientTeamId: true,
          clientTeam: {
            select: {
              id: true, name: true, companyId: true, departmentId: true, businessUnitId: true,
              businessUnit: { select: { name: true } }
            }
          },
          leaderId: true,
          technicalLeadId: true,
          impactedSystemIds: true,
          macroScope: true,
          requestDate: true,
          businessExpectationDate: true,
          status: true,
          previousStatus: true,
          executingTeamId: true,
          executingDirectorate: true,
          rationale: true,
          externalLinkType: true,
          externalLinkName: true,
          externalLinkUrl: true,
          createdById: true,
          assignedManagerId: true,
          initiativeType: true,
          memberIds: true,
          startDate: true,
          endDate: true,
          actualEndDate: true,
          priority: true,
          createdAt: true
        }
      });

      if (historyEntries !== null) {
        await tx.initiativeHistory.deleteMany({ where: { initiativeId: initiative.id } });
        if (historyEntries.length > 0) {
          await tx.initiativeHistory.createMany({
            data: historyEntries.map((entry: any) => ({
              id: entry.id ?? randomUUID(),
              timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
              user: entry.user ?? 'Usuário',
              action: entry.action ?? '',
              fromStatus: entry.fromStatus ?? null,
              toStatus: entry.toStatus ?? null,
              notes: entry.notes ?? null,
              initiativeId: initiative.id
            }))
          });
        }
      }

      if (milestones !== null) {
        await tx.milestoneTask.deleteMany({
          where: { milestone: { initiativeId: initiative.id } }
        });
        await tx.initiativeMilestone.deleteMany({ where: { initiativeId: initiative.id } });
        for (let index = 0; index < milestones.length; index++) {
          const milestone: any = milestones[index];
          await tx.initiativeMilestone.create({
            data: {
              id: milestone.id ?? randomUUID(),
              name: milestone.name ?? '',
              systemId: milestone.systemId ?? '',
              baselineDate: milestone.baselineDate ?? '',
              realDate: milestone.realDate ?? null,
              description: milestone.description ?? null,
              assignedEngineerId: milestone.assignedEngineerId ?? null,
              startDate: milestone.startDate ?? null,
              order: typeof milestone.order === 'number' ? milestone.order : index,
              initiativeId: initiative.id,
              tasks: Array.isArray(milestone.tasks)
                ? {
                    create: milestone.tasks.map((task: any, taskIndex: number) => ({
                      id: task.id ?? randomUUID(),
                      name: task.name ?? '',
                      status: task.status ?? 'Backlog',
                      type: task.type ?? null,
                      assigneeId: task.assigneeId ?? null,
                      systemId: task.systemId ?? null,
                      systemIds: Array.isArray(task.systemIds) ? task.systemIds : [],
                      priority: typeof task.priority === 'number' ? task.priority : null,
                      startDate: task.startDate ?? null,
                      targetDate: task.targetDate ?? null,
                      notes: task.notes ?? null,
                      taskHistory: Array.isArray(task.taskHistory) ? task.taskHistory : [],
                      order: typeof task.order === 'number' ? task.order : taskIndex
                    }))
                  }
                : undefined
            }
          });
        }
      }

      return updated;
    });

    const updated = await this.findById(initiative.id);
    if (!updated) {
      throw new Error('Failed to load updated initiative');
    }
    return updated;
  }

  async create(payload: Omit<Initiative, 'id' | 'createdAt'>): Promise<Initiative> {
    const row = await this.prisma.initiative.create({
      data: {
        title: payload.title,
        status: payload.status,
        priority: payload.priority,
        companyId: payload.companyId ?? 'default-company',
        departmentId: payload.departmentId ?? 'default-department',
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
        impactedSystemIds: payload.impactedSystemIds ?? [],
        macroScope: payload.macroScope ?? [],
        memberIds: payload.memberIds ?? []
      },
      select: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        type: true,
        benefit: true,
        benefitType: true,
        scope: true,
        customerOwner: true,
        clientTeamId: true,
        clientTeam: {
          select: {
            id: true, name: true, companyId: true, departmentId: true, businessUnitId: true,
            businessUnit: { select: { name: true } }
          }
        },
        leaderId: true,
        technicalLeadId: true,
        impactedSystemIds: true,
        macroScope: true,
        requestDate: true,
        businessExpectationDate: true,
        status: true,
        previousStatus: true,
        executingTeamId: true,
        executingDirectorate: true,
        rationale: true,
        externalLinkType: true,
        externalLinkName: true,
        externalLinkUrl: true,
        createdById: true,
        assignedManagerId: true,
        initiativeType: true,
        memberIds: true,
        startDate: true,
        endDate: true,
        actualEndDate: true,
        priority: true,
        createdAt: true
      }
    });

    return this.mapToDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      await tx.milestoneTask.deleteMany({
        where: { milestone: { initiativeId: id } }
      });
      await tx.initiativeComment.deleteMany({
        where: { initiativeId: id }
      });
      await tx.initiativeHistory.deleteMany({
        where: { initiativeId: id }
      });
      await tx.initiativeMilestone.deleteMany({
        where: { initiativeId: id }
      });
      await tx.initiative.delete({
        where: { id }
      });
    });
  }

  async countByClientTeamId(clientTeamId: string): Promise<number> {
    return this.prisma.initiative.count({ where: { clientTeamId } });
  }
}
