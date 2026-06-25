import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { OracleService } from '../../../../infrastructure/persistence/oracle/oracle.service.js';

describe('OracleService', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env.ORACLE_USER = 'user';
    process.env.ORACLE_PASSWORD = 'pass';
    process.env.ORACLE_CONNECTION_STRING = 'host:1521/svc';
    process.env.ORACLE_POOL_MIN = '1';
    process.env.ORACLE_POOL_MAX = '2';
    process.env.ORACLE_POOL_TIMEOUT_SECONDS = '5';
    process.env.ORACLE_POOL_PING_INTERVAL_SECONDS = '10';
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('executes query and returns rows', async () => {
    const execute = jest.fn(async () => ({ rows: [{ id: 1 }] }));
    const closeConn = jest.fn(async () => undefined);
    const getConnection = jest.fn(async () => ({ execute, close: closeConn }));
    const closePool = jest.fn(async () => undefined);
    const createPool = jest.fn(async () => ({ getConnection, close: closePool }));

    const service = new OracleService() as any;
    service.loadOracleModule = jest.fn(async () => ({
      OUT_FORMAT_OBJECT: 1,
      CLOB: 2005,
      createPool
    }));

    const rows = await service.query('select 1 from dual');

    expect(createPool).toHaveBeenCalledTimes(1);
    expect(getConnection).toHaveBeenCalledTimes(1);
    expect((execute as any).mock.calls[0]).toEqual(['select 1 from dual', {}, {}]);
    expect(rows).toEqual([{ id: 1 }]);
    expect(closeConn).toHaveBeenCalledTimes(1);
  });

  it('executes statement with autoCommit true', async () => {
    const execute = jest.fn(async () => ({}));
    const closeConn = jest.fn(async () => undefined);
    const getConnection = jest.fn(async () => ({ execute, close: closeConn }));
    const createPool = jest.fn(async () => ({ getConnection, close: jest.fn(async () => undefined) }));

    const service = new OracleService() as any;
    service.loadOracleModule = jest.fn(async () => ({ createPool }));

    await service.execute('update t set a = 1', { id: 'x' });

    expect((execute as any).mock.calls[0]).toEqual([
      'update t set a = 1',
      { id: 'x' },
      { autoCommit: true }
    ]);
  });

  it('reuses pool between calls', async () => {
    const execute = jest.fn(async () => ({ rows: [] }));
    const closeConn = jest.fn(async () => undefined);
    const getConnection = jest.fn(async () => ({ execute, close: closeConn }));
    const createPool = jest.fn(async () => ({ getConnection, close: jest.fn(async () => undefined) }));

    const service = new OracleService() as any;
    service.loadOracleModule = jest.fn(async () => ({ createPool }));

    await service.query('select * from a');
    await service.query('select * from b');

    expect(createPool).toHaveBeenCalledTimes(1);
    expect(getConnection).toHaveBeenCalledTimes(2);
  });

  it('throws clear error when required env is missing', async () => {
    delete process.env.ORACLE_USER;

    const service = new OracleService() as any;
    service.loadOracleModule = jest.fn(async () => ({ createPool: jest.fn() }));

    await expect(service.query('select 1 from dual')).rejects.toThrow(
      '[oracle] Missing required environment variable: ORACLE_USER'
    );
  });

  it('closes pool on module destroy', async () => {
    const close = jest.fn(async () => undefined);
    const service = new OracleService() as any;
    service.pool = { close, getConnection: jest.fn() };

    await service.onModuleDestroy();

    expect((close as any).mock.calls[0]).toEqual([5]);
    expect(service.pool).toBeNull();
  });

  it('does nothing on module destroy when pool is null', async () => {
    const service = new OracleService() as any;
    service.pool = null;

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });

  it('uses existing pool without loading oracledb module again', async () => {
    const execute = jest.fn(async () => ({ rows: [{ ok: true }] }));
    const closeConn = jest.fn(async () => undefined);
    const getConnection = jest.fn(async () => ({ execute, close: closeConn }));
    const service = new OracleService() as any;
    service.pool = { getConnection, close: jest.fn(async () => undefined) };
    service.loadOracleModule = jest.fn(async () => {
      throw new Error('should not load module');
    });

    const rows = await service.query('select x from y', { x: 1 });

    expect(rows).toEqual([{ ok: true }]);
    expect(service.loadOracleModule).not.toHaveBeenCalled();
  });
});
