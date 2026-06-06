import type { PrismaClient } from '@prisma/client';
import type { Initiative } from '../../domain/models/Initiative.js';
import type { InitiativeRepository } from '../../domain/repositories/InitiativeRepository.js';

export class PrismaInitiativeRepository implements InitiativeRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapToDomain(row: {
    id: string;
    title: string;
    companyId: string;
    departmentId: string;
    status: string;
    priority: number;
    createdAt: Date;
  }): Initiative {
    return {
      id: row.id,
      title: row.title,
      companyId: row.companyId,
      departmentId: row.departmentId,
      status: row.status as Initiative['status'],
      priority: row.priority,
      createdAt: row.createdAt
    };
  }

  async findById(id: string): Promise<Initiative | null> {
    const row = await this.prisma.initiative.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        status: true,
        priority: true,
        createdAt: true
      }
    });
    if (!row) return null;
    return this.mapToDomain(row);
  }

  async listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    const where: { companyId?: string; departmentId?: string } = {};
    if (scope.companyId) where.companyId = scope.companyId;
    if (scope.departmentId) where.departmentId = scope.departmentId;

    const rows = await this.prisma.initiative.findMany({
      select: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        status: true,
        priority: true,
        createdAt: true
      },
      where,
      orderBy: { createdAt: 'desc' }
    });

    return rows.map(row => this.mapToDomain(row));
  }

  async save(initiative: Initiative): Promise<Initiative> {
    const row = await this.prisma.initiative.update({
      where: { id: initiative.id },
      data: {
        priority: initiative.priority ?? 0,
        status: initiative.status,
        title: initiative.title,
        companyId: initiative.companyId,
        departmentId: initiative.departmentId
      },
      select: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        status: true,
        priority: true,
        createdAt: true
      }
    });

    return this.mapToDomain(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.initiative.delete({ where: { id } });
  }
}
