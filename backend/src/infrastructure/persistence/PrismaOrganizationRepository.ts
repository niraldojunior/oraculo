import type { PrismaClient } from '@prisma/client';
import type {
  CollaboratorWriteData,
  OrganizationRepository,
  TeamWriteData
} from '../../domain/repositories/OrganizationRepository.js';

export class PrismaOrganizationRepository implements OrganizationRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<any[]> {
    const where: { companyId?: string; departmentId?: string } = {};
    if (scope.companyId) where.companyId = scope.companyId;
    if (scope.departmentId) where.departmentId = scope.departmentId;
    return this.prisma.team.findMany({ where });
  }

  async listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    safeSelect: any;
    dashboardSelect: any;
  }): Promise<any[]> {
    const { scope, lite, safeSelect, dashboardSelect } = params;
    const where: { companyId?: string; departmentId?: string } = {};
    if (scope.companyId) where.companyId = scope.companyId;
    if (scope.departmentId) where.departmentId = scope.departmentId;

    return this.prisma.collaborator.findMany({
      where,
      select: lite ? dashboardSelect : safeSelect
    });
  }

  async findCollaboratorById(id: string): Promise<any | null> {
    return this.prisma.collaborator.findUnique({ where: { id } });
  }

  async findCollaboratorByEmail(email: string): Promise<any | null> {
    return this.prisma.collaborator.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        departmentId: true,
        photoUrl: true,
        phone: true,
        bio: true,
        linkedinUrl: true,
        githubUrl: true,
        isAdmin: true,
        skills: true,
        squadId: true,
        associatedCompanyIds: true
      }
    });
  }

  async createTeam(data: TeamWriteData): Promise<any> {
    return this.prisma.team.create({ data: data as any });
  }

  async updateTeam(id: string, data: TeamWriteData): Promise<any> {
    return this.prisma.team.update({
      where: { id },
      data: data as any
    });
  }

  async deleteTeam(id: string): Promise<void> {
    await this.prisma.team.delete({ where: { id } });
  }

  async createCollaborator(data: CollaboratorWriteData): Promise<any> {
    return this.prisma.collaborator.create({
      data: data as any,
      include: {
        absences: true,
        skills: { include: { skill: true } }
      }
    });
  }

  async updateCollaborator(id: string, data: CollaboratorWriteData): Promise<any> {
    return this.prisma.collaborator.update({
      where: { id },
      data: data as any,
      include: {
        absences: true,
        skills: { include: { skill: true } }
      }
    });
  }

  async deleteCollaborator(id: string): Promise<void> {
    await this.prisma.collaborator.delete({ where: { id } });
  }

  async toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }): Promise<void> {
    const { collaboratorId, skillId, active } = params;

    if (active) {
      await this.prisma.collaboratorSkill.upsert({
        where: { collaboratorId_skillId: { collaboratorId, skillId } },
        create: { collaboratorId, skillId },
        update: {}
      });
      return;
    }

    await this.prisma.collaboratorSkill.deleteMany({
      where: { collaboratorId, skillId }
    });
  }
}
