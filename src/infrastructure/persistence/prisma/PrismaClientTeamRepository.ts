import type { PrismaClient } from '@prisma/client';
import type { ClientTeam, ClientTeamWriteData } from '../../../domain/entities/ClientTeam.js';
import type { ClientTeamRepository } from '../../../domain/repositories/ClientTeamRepository.js';

type ClientTeamRow = {
  id: string;
  name: string;
  companyId: string;
  departmentId: string;
  businessUnitId: string | null;
  businessUnit: { name: string } | null;
};

function toClientTeam(row: ClientTeamRow): ClientTeam {
  return {
    id: row.id,
    name: row.name,
    companyId: row.companyId,
    departmentId: row.departmentId,
    businessUnitId: row.businessUnitId,
    businessUnitName: row.businessUnit?.name ?? null
  };
}

export class PrismaClientTeamRepository implements ClientTeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listClientTeams(scope: { companyId?: string; departmentId?: string }): Promise<ClientTeam[]> {
    const rows = await this.prisma.clientTeam.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        departmentId: true,
        businessUnitId: true,
        businessUnit: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    return rows.map(toClientTeam);
  }

  async findClientTeamById(id: string): Promise<ClientTeam | null> {
    const row = await this.prisma.clientTeam.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        companyId: true,
        departmentId: true,
        businessUnitId: true,
        businessUnit: { select: { name: true } }
      }
    });
    return row ? toClientTeam(row) : null;
  }

  async createClientTeam(data: ClientTeamWriteData): Promise<ClientTeam> {
    const row = await this.prisma.clientTeam.create({
      data: {
        name: data.name ?? '',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        businessUnitId: data.businessUnitId ?? null
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        departmentId: true,
        businessUnitId: true,
        businessUnit: { select: { name: true } }
      }
    });

    return toClientTeam(row);
  }

  async updateClientTeam(id: string, data: ClientTeamWriteData): Promise<ClientTeam> {
    const row = await this.prisma.clientTeam.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.businessUnitId !== undefined ? { businessUnitId: data.businessUnitId } : {})
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        departmentId: true,
        businessUnitId: true,
        businessUnit: { select: { name: true } }
      }
    });

    return toClientTeam(row);
  }

  async deleteClientTeam(id: string): Promise<void> {
    await this.prisma.clientTeam.delete({ where: { id } });
  }
}
