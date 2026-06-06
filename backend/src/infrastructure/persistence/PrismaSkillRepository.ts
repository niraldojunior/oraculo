import type { PrismaClient } from '@prisma/client';
import type { SkillRepository, SkillWriteData } from '../../domain/repositories/SkillRepository.js';

export class PrismaSkillRepository implements SkillRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listSkills(scope: { companyId?: string; departmentId?: string }): Promise<any[]> {
    return this.prisma.skill.findMany({
      where: scope,
      select: {
        id: true,
        name: true,
        description: true,
        familia: true,
        icon: true,
        companyId: true,
        departmentId: true,
        collaborators: {
          select: {
            collaborator: {
              select: { id: true, name: true, photoUrl: true, role: true }
            }
          }
        }
      }
    });
  }

  async createSkill(data: SkillWriteData, memberIds?: string[]): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const newSkill = await tx.skill.create({
        data: data as any
      });

      if (memberIds && Array.isArray(memberIds)) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map((cid: string) => ({
            collaboratorId: cid,
            skillId: newSkill.id
          }))
        });
      }

      return newSkill;
    }, { timeout: 10000 });
  }

  async updateSkill(id: string, data: SkillWriteData, memberIds?: string[]): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      await tx.skill.update({
        where: { id },
        data: data as any
      });

      await tx.collaboratorSkill.deleteMany({ where: { skillId: id } });

      if (Array.isArray(memberIds) && memberIds.length > 0) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map((cid: string) => ({
            collaboratorId: cid,
            skillId: id
          }))
        });
      }

      return tx.skill.findUnique({
        where: { id },
        include: {
          collaborators: {
            include: {
              collaborator: { select: { id: true, name: true, photoUrl: true, role: true } }
            }
          }
        }
      });
    }, { timeout: 10000 });
  }

  async deleteSkill(id: string): Promise<void> {
    await this.prisma.collaboratorSkill.deleteMany({ where: { skillId: id } });
    await this.prisma.skill.delete({ where: { id } });
  }
}