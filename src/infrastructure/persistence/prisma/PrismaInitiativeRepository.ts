import type { PrismaClient } from '@prisma/client';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';

export class PrismaInitiativeRepository implements InitiativeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToDomain(row: {
    id: string;
    title: string;
    companyId: string;
    departmentId: string;
    type: string;
    benefit: string;
    scope: string;
    customerOwner: string;
    originDirectorate: string;
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
    const normalizedStatus =
      row.status === 'Done' || row.status === 'In Progress' || row.status === 'Backlog'
        ? row.status
        : 'Backlog';

    return {
      id: row.id,
      title: row.title,
      companyId: row.companyId,
      departmentId: row.departmentId,
      type: row.type,
      benefit: row.benefit,
      scope: row.scope,
      customerOwner: row.customerOwner,
      originDirectorate: row.originDirectorate,
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
        scope: true,
        customerOwner: true,
        originDirectorate: true,
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
        scope: true,
        customerOwner: true,
        originDirectorate: true,
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

    return row ? this.mapToDomain(row) : null;
  }

  async save(initiative: Initiative): Promise<Initiative> {
    const row = await this.prisma.initiative.update({
      where: { id: initiative.id },
      data: {
        title: initiative.title,
        status: initiative.status,
        priority: initiative.priority,
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
        scope: true,
        customerOwner: true,
        originDirectorate: true,
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

  async create(payload: Omit<Initiative, 'id' | 'createdAt'>): Promise<Initiative> {
    const row = await this.prisma.initiative.create({
      data: {
        title: payload.title,
        status: payload.status,
        priority: payload.priority,
        companyId: payload.companyId ?? 'default-company',
        departmentId: payload.departmentId ?? 'default-department',
        type: 'General',
        benefit: 'N/A',
        scope: 'N/A',
        customerOwner: 'N/A',
        originDirectorate: 'N/A',
        impactedSystemIds: [],
        macroScope: [],
        memberIds: []
      },
      select: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        type: true,
        benefit: true,
        scope: true,
        customerOwner: true,
        originDirectorate: true,
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
}
