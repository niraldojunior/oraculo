import type { PrismaClient } from '@prisma/client';
import type { Skill, SkillWriteData } from '../../../domain/entities/Skill.js';
import type { SkillRepository } from '../../../domain/repositories/SkillRepository.js';

export class PrismaSkillRepository implements SkillRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listSkills(scope: { companyId?: string; departmentId?: string }): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      },
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
              select: {
                id: true,
                name: true,
                photoUrl: true,
                role: true
              }
            }
          }
        }
      }
    });
  }

  async createSkill(data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
    return this.prisma.$transaction(async tx => {
      const newSkill = await tx.skill.create({
        data: {
          name: data.name ?? '',
          description: data.description ?? '',
          familia: data.familia ?? null,
          icon: data.icon ?? null,
          companyId: data.companyId ?? '',
          departmentId: data.departmentId ?? ''
        }
      });

      if (Array.isArray(memberIds) && memberIds.length > 0) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map(collaboratorId => ({ collaboratorId, skillId: newSkill.id }))
        });
      }

      const created = await tx.skill.findUnique({
        where: { id: newSkill.id },
        include: {
          collaborators: {
            include: {
              collaborator: {
                select: { id: true, name: true, photoUrl: true, role: true }
              }
            }
          }
        }
      });
      if (!created) throw new Error('Skill not found after creation');
      return created as Skill;
    }, { timeout: 10000 });
  }

  async updateSkill(id: string, data: SkillWriteData, memberIds?: string[]): Promise<Skill> {
    return this.prisma.$transaction(async tx => {
      await tx.skill.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.familia !== undefined ? { familia: data.familia } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
          ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {})
        }
      });

      await tx.collaboratorSkill.deleteMany({ where: { skillId: id } });

      if (Array.isArray(memberIds) && memberIds.length > 0) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map(collaboratorId => ({ collaboratorId, skillId: id }))
        });
      }

      const updated = await tx.skill.findUnique({
        where: { id },
        include: {
          collaborators: {
            include: {
              collaborator: {
                select: { id: true, name: true, photoUrl: true, role: true }
              }
            }
          }
        }
      });
      if (!updated) throw new Error('Skill not found after update');
      return updated as Skill;
    }, { timeout: 10000 });
  }

  async deleteSkill(id: string): Promise<void> {
    await this.prisma.collaboratorSkill.deleteMany({ where: { skillId: id } });
    await this.prisma.skill.delete({ where: { id } });
  }
}
