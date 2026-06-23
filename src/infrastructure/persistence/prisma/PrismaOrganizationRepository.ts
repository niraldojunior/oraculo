import type { PrismaClient } from '@prisma/client';
import type { Collaborator, CollaboratorWriteData } from '../../../domain/entities/Collaborator.js';
import type { Team, TeamWriteData } from '../../../domain/entities/Team.js';
import type { OrganizationRepository } from '../../../domain/repositories/OrganizationRepository.js';

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listTeamsByScope(scope: { companyId?: string; departmentId?: string }): Promise<Team[]> {
    return this.prisma.team.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      }
    });
  }

  async listCollaboratorsByScope(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
  }): Promise<Collaborator[]> {
    return this.prisma.collaborator.findMany({
      where: {
        ...(params.scope.companyId ? { companyId: params.scope.companyId } : {}),
        ...(params.scope.departmentId ? { departmentId: params.scope.departmentId } : {})
      },
      select: params.lite
        ? {
            id: true,
            companyId: true,
            departmentId: true,
            name: true,
            email: true,
            role: true,
            squadId: true,
            photoUrl: true,
            isAdmin: true,
            associatedCompanyIds: true,
            vacationStart: true,
            startDate: true,
            endDate: true,
            birthday: true,
            uf: true,
            phone: true,
            bio: true,
            linkedinUrl: true,
            githubUrl: true
          }
        : {
            id: true,
            companyId: true,
            departmentId: true,
            name: true,
            email: true,
            role: true,
            squadId: true,
            photoUrl: true,
            phone: true,
            bio: true,
            linkedinUrl: true,
            githubUrl: true,
            isAdmin: true,
            vacationStart: true,
            startDate: true,
            endDate: true,
            birthday: true,
            uf: true,
            associatedCompanyIds: true
          }
    }) as unknown as Collaborator[];
  }

  async findCollaboratorById(id: string): Promise<Collaborator | null> {
    return (await this.prisma.collaborator.findUnique({ where: { id } })) as unknown as Collaborator | null;
  }

  async findCollaboratorByEmail(email: string): Promise<Collaborator | null> {
    return (await this.prisma.collaborator.findUnique({ where: { email } })) as unknown as Collaborator | null;
  }

  async createTeam(data: TeamWriteData): Promise<Team> {
    return this.prisma.team.create({
      data: {
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        name: data.name ?? '',
        type: data.type ?? '',
        parentTeamId: data.parentTeamId ?? null,
        leaderId: data.leaderId ?? null,
        receivesInitiatives: data.receivesInitiatives ?? false
      }
    });
  }

  async updateTeam(id: string, data: TeamWriteData): Promise<Team> {
    return this.prisma.team.update({
      where: { id },
      data: {
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.parentTeamId !== undefined ? { parentTeamId: data.parentTeamId } : {}),
        ...(data.leaderId !== undefined ? { leaderId: data.leaderId } : {}),
        ...(data.receivesInitiatives !== undefined
          ? { receivesInitiatives: data.receivesInitiatives }
          : {})
      }
    });
  }

  async deleteTeam(id: string): Promise<void> {
    await this.prisma.team.delete({ where: { id } });
  }

  async createCollaborator(data: CollaboratorWriteData): Promise<Collaborator> {
    return (await this.prisma.collaborator.create({
      data: {
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        name: data.name ?? '',
        email: data.email ?? '',
        role: data.role ?? '',
        squadId: data.squadId ?? null,
        photoUrl: data.photoUrl ?? null,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        linkedinUrl: data.linkedinUrl ?? null,
        githubUrl: data.githubUrl ?? null,
        isAdmin: data.isAdmin ?? false,
        vacationStart: data.vacationStart ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        birthday: data.birthday ?? null,
        uf: data.uf ?? null,
        associatedCompanyIds: data.associatedCompanyIds ?? []
      }
    })) as unknown as Collaborator;
  }

  async updateCollaborator(id: string, data: CollaboratorWriteData): Promise<Collaborator> {
    return (await this.prisma.collaborator.update({
      where: { id },
      data: {
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.squadId !== undefined ? { squadId: data.squadId } : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.linkedinUrl !== undefined ? { linkedinUrl: data.linkedinUrl } : {}),
        ...(data.githubUrl !== undefined ? { githubUrl: data.githubUrl } : {}),
        ...(data.isAdmin !== undefined ? { isAdmin: data.isAdmin } : {}),
        ...(data.vacationStart !== undefined ? { vacationStart: data.vacationStart } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.birthday !== undefined ? { birthday: data.birthday } : {}),
        ...(data.uf !== undefined ? { uf: data.uf } : {}),
        ...(data.associatedCompanyIds !== undefined
          ? { associatedCompanyIds: data.associatedCompanyIds }
          : {})
      }
    })) as unknown as Collaborator;
  }

  async deleteCollaborator(id: string): Promise<void> {
    await this.prisma.collaborator.delete({ where: { id } });
  }

  async toggleCollaboratorSkill(params: {
    collaboratorId: string;
    skillId: string;
    active: boolean;
  }): Promise<void> {
    if (params.active) {
      await this.prisma.collaboratorSkill.upsert({
        where: {
          collaboratorId_skillId: {
            collaboratorId: params.collaboratorId,
            skillId: params.skillId
          }
        },
        create: {
          collaboratorId: params.collaboratorId,
          skillId: params.skillId
        },
        update: {}
      });
      return;
    }

    await this.prisma.collaboratorSkill.deleteMany({
      where: {
        collaboratorId: params.collaboratorId,
        skillId: params.skillId
      }
    });
  }
}
