import { describe, expect, it, jest } from '@jest/globals';
import { PrismaBusinessUnitRepository } from '../../../../infrastructure/persistence/prisma/PrismaBusinessUnitRepository.js';

describe('PrismaBusinessUnitRepository', () => {
  const row = { id: 'b1', name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' };

  it('lists business units filtering by companyId and departmentId', async () => {
    const prisma: any = { businessUnit: { findMany: jest.fn(async () => [row]) } };
    const repo = new PrismaBusinessUnitRepository(prisma);

    const result = await repo.listBusinessUnits({ companyId: 'c1', departmentId: 'd1' });

    expect(result).toEqual([row]);
    expect(prisma.businessUnit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'c1', departmentId: 'd1' }, orderBy: { name: 'asc' } })
    );
  });

  it('lists business units with no scope', async () => {
    const prisma: any = { businessUnit: { findMany: jest.fn(async () => [row]) } };
    const repo = new PrismaBusinessUnitRepository(prisma);

    await repo.listBusinessUnits({});

    expect(prisma.businessUnit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('creates a business unit defaulting missing fields', async () => {
    const prisma: any = { businessUnit: { create: jest.fn(async () => row) } };
    const repo = new PrismaBusinessUnitRepository(prisma);

    const created = await repo.createBusinessUnit({});

    expect(created).toEqual(row);
    expect(prisma.businessUnit.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: '', companyId: '', departmentId: '' } })
    );
  });

  it('creates a business unit with provided fields', async () => {
    const prisma: any = { businessUnit: { create: jest.fn(async () => row) } };
    const repo = new PrismaBusinessUnitRepository(prisma);

    await repo.createBusinessUnit({ name: 'FTTH', companyId: 'c1', departmentId: 'd1' });

    expect(prisma.businessUnit.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'FTTH', companyId: 'c1', departmentId: 'd1' } })
    );
  });

  it('updates only the provided fields', async () => {
    const prisma: any = { businessUnit: { update: jest.fn(async () => row) } };
    const repo = new PrismaBusinessUnitRepository(prisma);

    await repo.updateBusinessUnit('b1', { name: 'FTTH' });

    expect(prisma.businessUnit.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b1' }, data: { name: 'FTTH' } })
    );
  });

  it('updates all fields when all are provided', async () => {
    const prisma: any = { businessUnit: { update: jest.fn(async () => row) } };
    const repo = new PrismaBusinessUnitRepository(prisma);

    await repo.updateBusinessUnit('b1', { name: 'FTTH', companyId: 'c2', departmentId: 'd2' });

    expect(prisma.businessUnit.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'FTTH', companyId: 'c2', departmentId: 'd2' } })
    );
  });

  it('updates with no fields provided', async () => {
    const prisma: any = { businessUnit: { update: jest.fn(async () => row) } };
    const repo = new PrismaBusinessUnitRepository(prisma);

    await repo.updateBusinessUnit('b1', {});

    expect(prisma.businessUnit.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: {} })
    );
  });

  it('deletes a business unit nullifying client team references first', async () => {
    const calls: string[] = [];
    const prisma: any = {
      clientTeam: {
        updateMany: jest.fn(async () => {
          calls.push('updateMany');
          return undefined;
        })
      },
      businessUnit: {
        delete: jest.fn(async () => {
          calls.push('delete');
          return undefined;
        })
      }
    };
    const repo = new PrismaBusinessUnitRepository(prisma);

    await repo.deleteBusinessUnit('b1');

    expect(prisma.clientTeam.updateMany).toHaveBeenCalledWith({
      where: { businessUnitId: 'b1' },
      data: { businessUnitId: null }
    });
    expect(prisma.businessUnit.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    expect(calls).toEqual(['updateMany', 'delete']);
  });
});
