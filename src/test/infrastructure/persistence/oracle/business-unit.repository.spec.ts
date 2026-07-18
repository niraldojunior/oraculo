import { describe, expect, it, jest } from '@jest/globals';
import { OracleBusinessUnitRepository } from '../../../../infrastructure/persistence/oracle/OracleBusinessUnitRepository.js';

describe('OracleBusinessUnitRepository', () => {
  const row = { id: 'b1', name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' };

  it('lists business units binding scope filters', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    const result = await repo.listBusinessUnits({ companyId: 'c1', departmentId: 'd1' });

    expect(result).toEqual([row]);
    expect(query.mock.calls[0][1]).toEqual({ companyId: 'c1', departmentId: 'd1' });
  });

  it('lists business units with no scope binding nulls', async () => {
    const query: any = jest.fn(async () => []);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    const result = await repo.listBusinessUnits({});

    expect(result).toEqual([]);
    expect(query.mock.calls[0][1]).toEqual({ companyId: null, departmentId: null });
  });

  it('maps missing name/company/department to empty strings', async () => {
    const query: any = jest.fn(async () => [{ id: 'b1', name: null, companyId: null, departmentId: null }]);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    const result = await repo.listBusinessUnits({});

    expect(result).toEqual([{ id: 'b1', name: '', companyId: '', departmentId: '' }]);
  });

  it('creates a business unit and returns it after finding by id', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    const created = await repo.createBusinessUnit({ name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' });

    expect(created).toEqual(row);
    expect(oracle.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "BusinessUnit"'),
      expect.objectContaining({ name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' })
    );
  });

  it('creates a business unit defaulting missing fields', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    await repo.createBusinessUnit({});

    expect(oracle.execute.mock.calls[0][1]).toMatchObject({ name: '', companyId: '', departmentId: '' });
  });

  it('throws when the business unit is not found right after creation', async () => {
    const query: any = jest.fn(async () => []);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    await expect(repo.createBusinessUnit({ name: 'X' })).rejects.toThrow('BusinessUnit not found after creation');
  });

  it('updates only the provided fields', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    await repo.updateBusinessUnit('b1', { name: 'FTTH' });

    expect(oracle.execute).toHaveBeenCalledWith(
      expect.stringContaining('"name" = :name'),
      expect.objectContaining({ id: 'b1', name: 'FTTH' })
    );
    const updateSql = String(oracle.execute.mock.calls[0][0]);
    expect(updateSql).not.toContain('"companyId" = :companyId');
    expect(updateSql).not.toContain('"departmentId" = :departmentId');
  });

  it('updates all fields when all are provided', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    await repo.updateBusinessUnit('b1', { name: 'FTTH', companyId: 'c2', departmentId: 'd2' });

    const [sql, binds] = oracle.execute.mock.calls[0];
    expect(String(sql)).toContain('"name" = :name');
    expect(String(sql)).toContain('"companyId" = :companyId');
    expect(String(sql)).toContain('"departmentId" = :departmentId');
    expect(binds).toEqual({ id: 'b1', name: 'FTTH', companyId: 'c2', departmentId: 'd2' });
  });

  it('skips the UPDATE statement when no fields are provided', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    await repo.updateBusinessUnit('b1', {});

    expect(oracle.execute).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('throws when the business unit is not found after update', async () => {
    const query: any = jest.fn(async () => []);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleBusinessUnitRepository(oracle);

    await expect(repo.updateBusinessUnit('missing', { name: 'X' })).rejects.toThrow('BusinessUnit not found after update');
  });

  it('deletes a business unit, nullifying client team references first', async () => {
    const oracle: any = { execute: jest.fn(async () => undefined), query: jest.fn() };
    const repo = new OracleBusinessUnitRepository(oracle);

    await repo.deleteBusinessUnit('b1');

    expect(oracle.execute).toHaveBeenCalledTimes(2);
    expect(String(oracle.execute.mock.calls[0][0])).toContain('UPDATE "ClientTeam" SET "businessUnitId" = NULL');
    expect(oracle.execute.mock.calls[0][1]).toEqual({ id: 'b1' });
    expect(String(oracle.execute.mock.calls[1][0])).toContain('DELETE FROM "BusinessUnit"');
    expect(oracle.execute.mock.calls[1][1]).toEqual({ id: 'b1' });
  });
});
