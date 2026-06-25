import { describe, expect, it, jest } from '@jest/globals';
import { SkillService } from '../../../application/services/skill.service.js';
import type { SkillRepository } from '../../../domain/repositories/SkillRepository.js';
import type { SkillWriteData } from '../../../domain/entities/Skill.js';

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

  it('lists, updates and deletes skills', async () => {
    const repository: SkillRepository = {
      listSkills: jest.fn(async () => [{ id: 's1', name: 'TS' } as any]),
      createSkill: jest.fn(async (data: SkillWriteData) => ({ id: 's1', ...data } as any)),
      updateSkill: jest.fn(async (id: string, data: SkillWriteData) => ({ id, ...data } as any)),
      deleteSkill: jest.fn(async () => undefined)
    };

    const service = new SkillService(repository);
    const list = await service.listSkills({ companyId: 'c1' });
    expect(list).toHaveLength(1);

    const payload: SkillWriteData = {
      name: 'React',
      description: 'UI',
      companyId: 'c1',
      departmentId: 'd1'
    };
    await service.updateSkill('s1', payload, ['u1']);
    expect(repository.updateSkill).toHaveBeenCalledWith('s1', payload, ['u1']);

    await service.deleteSkill('s1');
    expect(repository.deleteSkill).toHaveBeenCalledWith('s1');
  });
});

