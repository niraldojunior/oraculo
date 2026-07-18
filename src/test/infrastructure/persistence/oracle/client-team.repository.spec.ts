import { describe, expect, it, jest } from '@jest/globals';
import { OracleClientTeamRepository } from '../../../../infrastructure/persistence/oracle/OracleClientTeamRepository.js';

describe('OracleClientTeamRepository', () => {
  const row = {
    id: 'ct1',
    name: 'Operações',
    companyId: 'c1',
    departmentId: 'd1',
    businessUnitId: 'b1',
    businessUnitName: 'Atacado & B2B'
  };

  it('lists client teams binding scope filters, joining business unit name', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleClientTeamRepository(oracle);

    const result = await repo.listClientTeams({ companyId: 'c1', departmentId: 'd1' });

    expect(result).toEqual([row]);
    expect(String(query.mock.calls[0][0])).toContain('LEFT JOIN "BusinessUnit"');
    expect(query.mock.calls[0][1]).toEqual({ companyId: 'c1', departmentId: 'd1' });
  });

  it('lists client teams with no scope binding nulls', async () => {
    const query: any = jest.fn(async () => []);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleClientTeamRepository(oracle);

    await repo.listClientTeams({});

    expect(query.mock.calls[0][1]).toEqual({ companyId: null, departmentId: null });
  });

  it('maps null businessUnitId and businessUnitName', async () => {
    const query: any = jest.fn(async () => [
      { id: 'ct2', name: 'Comercial', companyId: 'c1', departmentId: 'd1', businessUnitId: null, businessUnitName: null }
    ]);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleClientTeamRepository(oracle);

    const result = await repo.listClientTeams({});

    expect(result[0].businessUnitId).toBeNull();
    expect(result[0].businessUnitName).toBeNull();
  });

  it('maps missing name/company/department to empty strings', async () => {
    const query: any = jest.fn(async () => [
      { id: 'ct2', name: null, companyId: null, departmentId: null, businessUnitId: null, businessUnitName: null }
    ]);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleClientTeamRepository(oracle);

    const result = await repo.listClientTeams({});

    expect(result[0]).toMatchObject({ name: '', companyId: '', departmentId: '' });
  });

  it('creates a client team and returns it after finding by id', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    const created = await repo.createClientTeam({ name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' });

    expect(created).toEqual(row);
    expect(oracle.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "ClientTeam"'),
      expect.objectContaining({ name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' })
    );
  });

  it('creates a client team defaulting missing fields', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    await repo.createClientTeam({});

    expect(oracle.execute.mock.calls[0][1]).toMatchObject({ name: '', companyId: '', departmentId: '', businessUnitId: null });
  });

  it('throws when the client team is not found right after creation', async () => {
    const query: any = jest.fn(async () => []);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    await expect(repo.createClientTeam({ name: 'X' })).rejects.toThrow('ClientTeam not found after creation');
  });

  it('updates only the provided fields', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    await repo.updateClientTeam('ct1', { name: 'Engenharia' });

    const updateSql = String(oracle.execute.mock.calls[0][0]);
    expect(updateSql).toContain('"name" = :name');
    expect(updateSql).not.toContain('"companyId" = :companyId');
    expect(updateSql).not.toContain('"departmentId" = :departmentId');
    expect(updateSql).not.toContain('"businessUnitId" = :businessUnitId');
  });

  it('updates all fields including businessUnitId', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    await repo.updateClientTeam('ct1', { name: 'Engenharia', companyId: 'c2', departmentId: 'd2', businessUnitId: 'b2' });

    const [sql, binds] = oracle.execute.mock.calls[0];
    expect(String(sql)).toContain('"name" = :name');
    expect(String(sql)).toContain('"companyId" = :companyId');
    expect(String(sql)).toContain('"departmentId" = :departmentId');
    expect(String(sql)).toContain('"businessUnitId" = :businessUnitId');
    expect(binds).toEqual({ id: 'ct1', name: 'Engenharia', companyId: 'c2', departmentId: 'd2', businessUnitId: 'b2' });
  });

  it('nulls businessUnitId when explicitly set to null', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    await repo.updateClientTeam('ct1', { businessUnitId: null });

    expect(oracle.execute.mock.calls[0][1]).toEqual({ id: 'ct1', businessUnitId: null });
  });

  it('skips the UPDATE statement when no fields are provided', async () => {
    const query: any = jest.fn(async () => [row]);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    await repo.updateClientTeam('ct1', {});

    expect(oracle.execute).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('throws when the client team is not found after update', async () => {
    const query: any = jest.fn(async () => []);
    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleClientTeamRepository(oracle);

    await expect(repo.updateClientTeam('missing', { name: 'X' })).rejects.toThrow('ClientTeam not found after update');
  });

  it('deletes a client team with a single DELETE statement', async () => {
    const oracle: any = { execute: jest.fn(async () => undefined), query: jest.fn() };
    const repo = new OracleClientTeamRepository(oracle);

    await repo.deleteClientTeam('ct1');

    expect(oracle.execute).toHaveBeenCalledTimes(1);
    expect(String(oracle.execute.mock.calls[0][0])).toContain('DELETE FROM "ClientTeam"');
    expect(oracle.execute.mock.calls[0][1]).toEqual({ id: 'ct1' });
  });
});
