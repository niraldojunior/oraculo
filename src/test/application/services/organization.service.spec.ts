import { describe, expect, it, jest } from '@jest/globals';
import { OrganizationService } from '../../../application/services/organization.service.js';
import type { OrganizationRepository } from '../../../domain/repositories/OrganizationRepository.js';
import type { CollaboratorWriteData } from '../../../domain/entities/Collaborator.js';
import type { TeamWriteData } from '../../../domain/entities/Team.js';

function createRepositoryDouble(): OrganizationRepository {
  return {
    listTeamsByScope: jest.fn(async () => []),
    listCollaboratorsByScope: jest.fn(async () => []),
    findCollaboratorById: jest.fn(async () => null),
    findCollaboratorByEmail: jest.fn(async () => null),
    createTeam: jest.fn(async (data: TeamWriteData) => ({
      id: 't1',
      companyId: data.companyId ?? 'c1',
      departmentId: data.departmentId ?? 'd1',
      name: data.name ?? 'Team',
      type: data.type ?? 'SQUAD',
      parentTeamId: data.parentTeamId ?? null,
      leaderId: data.leaderId ?? null,
      receivesInitiatives: data.receivesInitiatives ?? false
    })),
    updateTeam: jest.fn(async (_id: string, data: TeamWriteData) => ({
      id: 't1',
      companyId: data.companyId ?? 'c1',
      departmentId: data.departmentId ?? 'd1',
      name: data.name ?? 'Team',
      type: data.type ?? 'SQUAD',
      parentTeamId: data.parentTeamId ?? null,
      leaderId: data.leaderId ?? null,
      receivesInitiatives: data.receivesInitiatives ?? false
    })),
    deleteTeam: jest.fn(async () => undefined),
    createCollaborator: jest.fn(async (data: CollaboratorWriteData) => ({
      id: 'u1',
      companyId: data.companyId ?? 'c1',
      departmentId: data.departmentId ?? 'd1',
      name: data.name ?? 'User',
      email: data.email ?? 'u@corp.com',
      role: data.role ?? 'Engineer',
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
    })),
    updateCollaborator: jest.fn(async (_id: string, data: CollaboratorWriteData) => ({
      id: 'u1',
      companyId: data.companyId ?? 'c1',
      departmentId: data.departmentId ?? 'd1',
      name: data.name ?? 'User',
      email: data.email ?? 'u@corp.com',
      role: data.role ?? 'Engineer',
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
    })),
    deleteCollaborator: jest.fn(async () => undefined),
    toggleCollaboratorSkill: jest.fn(async () => undefined)
  };
}

describe('OrganizationService', () => {
  it('normalizes collaborator role and strips image reference', async () => {
    const repository = createRepositoryDouble();
    const service = new OrganizationService(repository);

    await service.createCollaborator({
      companyId: 'c1',
      departmentId: 'd1',
      name: 'Ana',
      email: 'ana@corp.com',
      role: 'VP',
      photoUrl: '/api/_img/collaborator/123'
    });

    const firstCallArg = (repository.createCollaborator as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(firstCallArg.role).toBe('Head');
    expect(firstCallArg).not.toHaveProperty('photoUrl');
  });

  it('normalizes list role variants', async () => {
    const repository = createRepositoryDouble();
    (repository.listCollaboratorsByScope as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue([
      {
        id: 'u1',
        companyId: 'c1',
        departmentId: 'd1',
        name: 'A',
        email: 'a@corp.com',
        role: 'ENGINEER/ANALYST',
        isAdmin: false,
        associatedCompanyIds: []
      }
    ]);

    const service = new OrganizationService(repository);
    const list = await service.listCollaboratorsByScope({
      scope: { companyId: 'c1' },
      lite: true
    });

    expect(list[0]?.role).toBe('Engineer');
  });

  it('delegates skill toggle to repository', async () => {
    const repository = createRepositoryDouble();
    const service = new OrganizationService(repository);

    await service.toggleCollaboratorSkill({
      collaboratorId: 'u1',
      skillId: 's1',
      active: true
    });

    expect(repository.toggleCollaboratorSkill).toHaveBeenCalledWith({
      collaboratorId: 'u1',
      skillId: 's1',
      active: true
    });
  });

  it('sanitizes team fields and delegates team methods', async () => {
    const repository = createRepositoryDouble();
    const service = new OrganizationService(repository);

    await service.createTeam({
      companyId: 'c1',
      departmentId: 'd1',
      name: 'Core Team',
      type: 'SQUAD',
      parentTeamId: '',
      leaderId: ''
    });

    const createArg = (repository.createTeam as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(createArg.parentTeamId).toBeNull();
    expect(createArg.leaderId).toBeNull();

    await service.listTeamsByScope({ companyId: 'c1' });
    expect(repository.listTeamsByScope).toHaveBeenCalledWith({ companyId: 'c1' });

    await service.updateTeam('t1', {
      companyId: 'c1',
      departmentId: 'd1',
      name: 'Core Team',
      type: 'SQUAD',
      parentTeamId: '',
      leaderId: ''
    });
    const updateArg = (repository.updateTeam as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(updateArg.parentTeamId).toBeNull();
    expect(updateArg.leaderId).toBeNull();

    await service.deleteTeam('t1');
    expect(repository.deleteTeam).toHaveBeenCalledWith('t1');
  });

  it('delegates collaborator lookup/update/delete', async () => {
    const repository = createRepositoryDouble();
    (repository.findCollaboratorById as jest.Mock).mockImplementation(async () => ({ id: 'u1' }));
    (repository.findCollaboratorByEmail as jest.Mock).mockImplementation(async () => ({ id: 'u2' }));

    const service = new OrganizationService(repository);
    await service.findCollaboratorById('u1');
    await service.findCollaboratorByEmail('u2@corp.com');

    expect(repository.findCollaboratorById).toHaveBeenCalledWith('u1');
    expect(repository.findCollaboratorByEmail).toHaveBeenCalledWith('u2@corp.com');

    await service.updateCollaborator('u1', {
      companyId: 'c1',
      departmentId: 'd1',
      name: 'Ana',
      email: 'ana@corp.com',
      role: 'Engineer/Analyst',
      squadId: '',
      vacationStart: '',
      startDate: '',
      endDate: '',
      birthday: '',
      photoUrl: '/api/_img/collaborator/u1'
    });
    const updateArg = (repository.updateCollaborator as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(updateArg.role).toBe('Engineer');
    expect(updateArg.squadId).toBeNull();
    expect(updateArg).not.toHaveProperty('photoUrl');

    await service.deleteCollaborator('u1');
    expect(repository.deleteCollaborator).toHaveBeenCalledWith('u1');
  });
});

