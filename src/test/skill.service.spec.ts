import { describe, expect, it, jest } from '@jest/globals';
import { SkillService } from '../application/services/skill.service.js';
import type { SkillRepository } from '../domain/repositories/SkillRepository.js';
import type { SkillWriteData } from '../domain/entities/Skill.js';

describe('SkillService', () => {
  it('delegates create with memberIds', async () => {
    const repository: SkillRepository = {
      listSkills: jest.fn(async () => []),
      createSkill: jest.fn(async (data: SkillWriteData, memberIds?: string[]) => ({
        id: 's1',
        name: data.name ?? '',
        description: data.description ?? '',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        collaborators: (memberIds ?? []).map((id: string) => ({
          collaborator: {
            id,
            name: 'Member',
            role: 'Operacional',
            photoUrl: null
          }
        }))
      })),
      updateSkill: jest.fn(async (_id: string, data: SkillWriteData) => ({
        id: 's1',
        name: data.name ?? '',
        description: data.description ?? '',
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? ''
      })),
      deleteSkill: jest.fn(async () => undefined)
    };

    const service = new SkillService(repository);
    await service.createSkill(
      { name: 'NestJS', description: 'Framework', companyId: 'c1', departmentId: 'd1' },
      ['u1', 'u2']
    );

    expect(repository.createSkill).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'NestJS' }),
      ['u1', 'u2']
    );
  });
});
