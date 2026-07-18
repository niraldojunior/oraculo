import { describe, expect, it, jest } from '@jest/globals';
import { PrismaClientTeamRepository } from '../../../../infrastructure/persistence/prisma/PrismaClientTeamRepository.js';

describe('PrismaClientTeamRepository', () => {
  const rowWithBusinessUnit = {
    id: 'ct1',
    name: 'Operações',
    companyId: 'c1',
    departmentId: 'd1',
    businessUnitId: 'b1',
    businessUnit: { name: 'Atacado & B2B' }
  };
  const rowWithoutBusinessUnit = {
    id: 'ct2',
    name: 'Comercial',
    companyId: 'c1',
    departmentId: 'd1',
    businessUnitId: null,
    businessUnit: null
  };

  it('lists client teams mapping business unit name when present', async () => {
    const prisma: any = { clientTeam: { findMany: jest.fn(async () => [rowWithBusinessUnit]) } };
    const repo = new PrismaClientTeamRepository(prisma);

    const result = await repo.listClientTeams({ companyId: 'c1', departmentId: 'd1' });

    expect(result).toEqual([
      { id: 'ct1', name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1', businessUnitName: 'Atacado & B2B' }
    ]);
    expect(prisma.clientTeam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'c1', departmentId: 'd1' }, orderBy: { name: 'asc' } })
    );
  });

  it('lists client teams with null business unit name when absent', async () => {
    const prisma: any = { clientTeam: { findMany: jest.fn(async () => [rowWithoutBusinessUnit]) } };
    const repo = new PrismaClientTeamRepository(prisma);

    const result = await repo.listClientTeams({});

    expect(result[0].businessUnitName).toBeNull();
    expect(prisma.clientTeam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('creates a client team defaulting missing fields', async () => {
    const prisma: any = { clientTeam: { create: jest.fn(async () => rowWithoutBusinessUnit) } };
    const repo = new PrismaClientTeamRepository(prisma);

    const created = await repo.createClientTeam({});

    expect(created.businessUnitId).toBeNull();
    expect(prisma.clientTeam.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: '', companyId: '', departmentId: '', businessUnitId: null } })
    );
  });

  it('creates a client team with provided fields', async () => {
    const prisma: any = { clientTeam: { create: jest.fn(async () => rowWithBusinessUnit) } };
    const repo = new PrismaClientTeamRepository(prisma);

    await repo.createClientTeam({ name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' });

    expect(prisma.clientTeam.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' } })
    );
  });

  it('updates only the provided fields including businessUnitId', async () => {
    const prisma: any = { clientTeam: { update: jest.fn(async () => rowWithBusinessUnit) } };
    const repo = new PrismaClientTeamRepository(prisma);

    await repo.updateClientTeam('ct1', { businessUnitId: 'b1' });

    expect(prisma.clientTeam.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ct1' }, data: { businessUnitId: 'b1' } })
    );
  });

  it('updates all fields including nulling businessUnitId', async () => {
    const prisma: any = { clientTeam: { update: jest.fn(async () => rowWithoutBusinessUnit) } };
    const repo = new PrismaClientTeamRepository(prisma);

    await repo.updateClientTeam('ct1', { name: 'Engenharia', companyId: 'c2', departmentId: 'd2', businessUnitId: null });

    expect(prisma.clientTeam.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Engenharia', companyId: 'c2', departmentId: 'd2', businessUnitId: null } })
    );
  });

  it('updates with no fields provided', async () => {
    const prisma: any = { clientTeam: { update: jest.fn(async () => rowWithoutBusinessUnit) } };
    const repo = new PrismaClientTeamRepository(prisma);

    await repo.updateClientTeam('ct1', {});

    expect(prisma.clientTeam.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: {} })
    );
  });

  it('deletes a client team', async () => {
    const prisma: any = { clientTeam: { delete: jest.fn(async () => undefined) } };
    const repo = new PrismaClientTeamRepository(prisma);

    await repo.deleteClientTeam('ct1');

    expect(prisma.clientTeam.delete).toHaveBeenCalledWith({ where: { id: 'ct1' } });
  });
});
