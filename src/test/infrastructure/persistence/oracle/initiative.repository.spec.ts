import { describe, expect, it, jest } from '@jest/globals';
import { OracleInitiativeRepository } from '../../../../infrastructure/persistence/oracle/OracleInitiativeRepository.js';

describe('OracleInitiativeRepository', () => {
  it('save persists scalars, history and milestones', async () => {
    const initiativeRow = {
      id: 'i1',
      title: 'Updated',
      companyId: 'c1',
      departmentId: 'd1',
      type: '2- Projeto',
      benefit: 'B',
      benefitType: 'Financeiro',
      scope: 'S',
      customerOwner: 'Owner',
      originDirectorate: 'Dir',
      leaderId: null,
      technicalLeadId: null,
      impactedSystemIds: [],
      macroScope: [],
      requestDate: null,
      businessExpectationDate: null,
      status: '9- Concluido',
      previousStatus: null,
      executingTeamId: null,
      executingDirectorate: null,
      rationale: null,
      externalLinkType: null,
      externalLinkName: null,
      externalLinkUrl: null,
      createdById: null,
      assignedManagerId: null,
      initiativeType: null,
      memberIds: [],
      startDate: '2026-06-01',
      endDate: '2026-06-20',
      actualEndDate: '2026-06-21',
      priority: 5,
      createdAt: new Date('2026-06-01T00:00:00.000Z')
    };

    const query: any = jest.fn();
    query
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([{
        id: 'm1',
        name: 'MS 1',
        systemId: 's1',
        baselineDate: '2026-06-01',
        realDate: null,
        description: null,
        assignedEngineerId: null,
        startDate: null,
        order: 0,
        initiativeId: 'i1'
      }])
      .mockResolvedValueOnce([{
        id: 't1',
        name: 'Task 1',
        status: 'Backlog',
        type: null,
        assigneeId: null,
        systemId: null,
        systemIds: '[]',
        priority: null,
        startDate: null,
        targetDate: null,
        notes: null,
        taskHistory: '[]',
        order: 0,
        milestoneId: 'm1',
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z')
      }])
      .mockResolvedValueOnce([{
        id: 'h1',
        timestamp: new Date('2026-06-21T12:00:00.000Z'),
        user: 'Ana',
        action: 'Save',
        fromStatus: '8- Implantacao',
        toStatus: '9- Concluido',
        notes: null,
        initiativeId: 'i1'
      }]);

    const oracle: any = {
      execute: jest.fn(async () => undefined),
      query
    };

    const repo = new OracleInitiativeRepository(oracle as any);
    const result = await repo.save({
      id: 'i1',
      title: 'Updated',
      companyId: 'c1',
      departmentId: 'd1',
      status: '9- Concluido',
      priority: 5,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      type: '2- Projeto',
      benefit: 'B',
      benefitType: 'Financeiro',
      scope: 'S',
      customerOwner: 'Owner',
      originDirectorate: 'Dir',
      startDate: '2026-06-01',
      endDate: '2026-06-20',
      actualEndDate: '2026-06-21',
      history: [{ id: 'h1', timestamp: '2026-06-21T12:00:00.000Z', user: 'Ana', action: 'Save' }],
      milestones: [{
        id: 'm1',
        name: 'MS 1',
        systemId: 's1',
        baselineDate: '2026-06-01',
        order: 0,
        tasks: [{
          id: 't1',
          name: 'Task 1',
          status: 'Backlog',
          milestoneId: 'm1'
        }]
      }]
    } as any);

    expect(oracle.execute.mock.calls[0][1]).toMatchObject({
      id: 'i1',
      actualEndDate: '2026-06-21',
      title: 'Updated'
    });
    expect(oracle.execute.mock.calls.some((call: any[]) => String(call[0]).includes('DELETE FROM "InitiativeHistory"'))).toBe(true);
    expect(oracle.execute.mock.calls.some((call: any[]) => String(call[0]).includes('INSERT INTO "InitiativeMilestone"'))).toBe(true);
    expect(result.history).toHaveLength(1);
    expect(result.milestones).toHaveLength(1);
  });

  it('listByScope maps rows and attaches milestones', async () => {
    const initiativeRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
      priority: 1, createdAt: new Date('2026-06-01T00:00:00.000Z')
    };
    const query: any = jest.fn();
    query
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([{
        id: 'm1', name: 'MS 1', systemId: 's1', baselineDate: '2026-06-01',
        realDate: null, description: null, assignedEngineerId: null, startDate: null,
        order: 0, initiativeId: 'i1'
      }])
      .mockResolvedValueOnce([{
        id: 't1', name: 'Task 1', status: 'Backlog', type: null, assigneeId: null,
        systemId: null, systemIds: '[]', priority: null, startDate: null, targetDate: null,
        notes: null, taskHistory: '[]', order: 0, milestoneId: 'm1',
        createdAt: new Date(), updatedAt: new Date()
      }]);

    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleInitiativeRepository(oracle);

    const result = await repo.listByScope({ companyId: 'c1', departmentId: 'd1' });

    expect(result).toHaveLength(1);
    expect(result[0].milestones).toHaveLength(1);
    expect(query.mock.calls[0][1]).toEqual({ companyId: 'c1', departmentId: 'd1' });
  });

  it('listByScope returns empty array without querying milestones when there are no rows', async () => {
    const query: any = jest.fn(async () => []);
    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleInitiativeRepository(oracle);

    const result = await repo.listByScope({});

    expect(result).toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('hydrates the current client team and derives originDirectorate', async () => {
    const query: any = jest.fn();
    query
      .mockResolvedValueOnce([{
        id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
        priority: 1, clientTeamId: 'ct1', createdAt: new Date()
      }])
      .mockResolvedValueOnce([{
        id: 'ct1', name: 'Operações e Engenharia', companyId: 'c1', departmentId: 'd1',
        businessUnitId: 'bu1', businessUnitName: 'Rede Neutra & Nio'
      }])
      .mockResolvedValueOnce([]);
    const repo = new OracleInitiativeRepository({ execute: jest.fn(), query } as any);

    const [initiative] = await repo.listByScope({ companyId: 'c1', departmentId: 'd1' });
    expect(initiative).toEqual(expect.objectContaining({
      clientTeamId: 'ct1', originDirectorate: 'Operações e Engenharia',
      clientTeam: expect.objectContaining({ id: 'ct1', businessUnitName: 'Rede Neutra & Nio' })
    }));
  });

  it('listByScope leaves milestones empty when an initiative has none', async () => {
    const initiativeRow = {
      id: 'i2', title: 'No milestones', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
      priority: 1, createdAt: new Date()
    };
    const query: any = jest.fn();
    query.mockResolvedValueOnce([initiativeRow]).mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleInitiativeRepository(oracle);

    const result = await repo.listByScope({});

    expect(result[0].milestones).toEqual([]);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('findById returns null when the initiative row is missing', async () => {
    const oracle: any = { execute: jest.fn(), query: jest.fn(async () => []) };
    const repo = new OracleInitiativeRepository(oracle);

    expect(await repo.findById('missing')).toBeNull();
  });

  it('maps non-array/non-string fields and mixed taskHistory shapes', async () => {
    const initiativeRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
      priority: 1, createdAt: new Date(), memberIds: 42
    };
    const query: any = jest.fn();
    query
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([{
        id: 'm1', name: 'MS 1', systemId: 's1', baselineDate: '2026-06-01',
        realDate: null, description: null, assignedEngineerId: null, startDate: null,
        order: 0, initiativeId: 'i1'
      }])
      .mockResolvedValueOnce([
        { id: 't1', name: 'Task array', status: 'Backlog', milestoneId: 'm1', taskHistory: [{ note: 'x' }], order: 0 },
        { id: 't2', name: 'Task invalid json', status: 'Backlog', milestoneId: 'm1', taskHistory: 'not-json{', order: 1 },
        { id: 't3', name: 'Task number', status: 'Backlog', milestoneId: 'm1', taskHistory: 999, order: 2 }
      ])
      .mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleInitiativeRepository(oracle);

    const result = await repo.findById('i1');

    expect(result?.memberIds).toEqual([]);
    const tasks = (result?.milestones as any)[0].tasks;
    expect(tasks[0].taskHistory).toEqual([{ note: 'x' }]);
    expect(tasks[1].taskHistory).toEqual([]);
    expect(tasks[2].taskHistory).toEqual([]);
  });

  it('findById maps all populated optional fields', async () => {
    const initiativeRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1',
      type: 'Type', benefit: 'B', benefitType: 'BT', scope: 'S', customerOwner: 'CO',
      originDirectorate: 'OD', leaderId: 'L1', technicalLeadId: 'TL1',
      impactedSystemIds: '["s1","s2"]', macroScope: '["m1"]',
      requestDate: '2026-01-01', businessExpectationDate: '2026-02-01',
      status: 'Backlog', previousStatus: 'Prev', executingTeamId: 'ET1',
      executingDirectorate: 'ED', rationale: 'R', externalLinkType: 'Jira',
      externalLinkName: 'EN', externalLinkUrl: 'http://x', createdById: 'U1',
      assignedManagerId: 'M1', initiativeType: 'IT', memberIds: '["u1"]',
      startDate: '2026-01-01', endDate: '2026-01-10', actualEndDate: '2026-01-11',
      createdAt: '2026-01-01T00:00:00.000Z'
    };
    const query: any = jest.fn();
    query
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([{
        id: 'm1', name: 'MS', systemId: 's1', baselineDate: '2026-01-01',
        realDate: '2026-01-05', description: 'Desc', assignedEngineerId: 'E1',
        startDate: '2026-01-01', order: 2, initiativeId: 'i1'
      }])
      .mockResolvedValueOnce([{
        id: 't1', name: 'Task', status: 'Backlog', type: 'Bug', assigneeId: 'A1',
        systemId: 'S1', systemIds: '["s1"]', priority: 2, startDate: '2026-01-01',
        targetDate: '2026-01-05', notes: 'note', taskHistory: '[{"a":1}]',
        order: 1, milestoneId: 'm1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z'
      }])
      .mockResolvedValueOnce([{
        id: 'h1', timestamp: '2026-01-01T00:00:00.000Z', user: 'Ana', action: 'Create',
        fromStatus: 'A', toStatus: 'B', notes: 'note', initiativeId: 'i1'
      }]);

    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleInitiativeRepository(oracle);

    const result = await repo.findById('i1');

    expect(result?.leaderId).toBe('L1');
    expect(result?.impactedSystemIds).toEqual(['s1', 's2']);
    expect(result?.memberIds).toEqual(['u1']);
    expect(result?.priority).toBe(0);
    expect((result?.milestones as any)[0].realDate).toBe('2026-01-05');
    expect((result?.milestones as any)[0].tasks[0].type).toBe('Bug');
    expect((result?.milestones as any)[0].tasks[0].systemIds).toEqual(['s1']);
    expect((result?.milestones as any)[0].tasks[0].taskHistory).toEqual([{ a: 1 }]);
    expect((result?.history as any)[0].fromStatus).toBe('A');
    expect((result?.history as any)[0].notes).toBe('note');
  });

  it('parseStringArray handles empty, invalid and non-array JSON strings', async () => {
    const initiativeRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
      priority: 1, createdAt: new Date(),
      impactedSystemIds: '', macroScope: 'not-json{', memberIds: '"just-a-string"'
    };
    const query: any = jest.fn();
    query.mockResolvedValueOnce([initiativeRow]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(), query };
    const repo = new OracleInitiativeRepository(oracle);

    const result = await repo.findById('i1');

    expect(result?.impactedSystemIds).toEqual([]);
    expect(result?.macroScope).toEqual([]);
    expect(result?.memberIds).toEqual([]);
  });

  it('save persists populated history and milestone/task fields, using fallbacks when absent', async () => {
    const initiativeRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
      priority: 1, createdAt: new Date()
    };
    const query: any = jest.fn();
    query
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleInitiativeRepository(oracle);

    await repo.save({
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1, createdAt: new Date(),
      history: [
        { fromStatus: 'A', toStatus: 'B', notes: 'note', user: 'Ana', action: 'Save' },
        {}
      ],
      milestones: [
        {
          name: 'MS', systemId: 's1', baselineDate: '2026-01-01',
          realDate: '2026-01-05', description: 'Desc', assignedEngineerId: 'E1', startDate: '2026-01-01',
          tasks: [
            { name: 'T1', type: 'Bug', assigneeId: 'A1', systemId: 'S1', systemIds: ['s1'], priority: 2, startDate: '2026-01-01', targetDate: '2026-01-05', notes: 'note', taskHistory: [{ a: 1 }], order: 5 }
          ]
        },
        { name: 'MS2', systemId: 's2', baselineDate: '2026-01-01' }
      ]
    } as any);

    const insertHistoryCalls = oracle.execute.mock.calls.filter((c: any[]) => String(c[0]).includes('INSERT INTO "InitiativeHistory"'));
    expect(insertHistoryCalls).toHaveLength(2);
    expect(insertHistoryCalls[0][1]).toMatchObject({ fromStatus: 'A', toStatus: 'B', notes: 'note' });
    expect(insertHistoryCalls[1][1]).toMatchObject({ fromStatus: null, toStatus: null, notes: null, user: 'Usuário', action: '' });

    const insertMilestoneCalls = oracle.execute.mock.calls.filter((c: any[]) => String(c[0]).includes('INSERT INTO "InitiativeMilestone"'));
    expect(insertMilestoneCalls).toHaveLength(2);
    expect(insertMilestoneCalls[0][1]).toMatchObject({ realDate: '2026-01-05', description: 'Desc', assignedEngineerId: 'E1', order: 0 });
    expect(insertMilestoneCalls[1][1]).toMatchObject({ realDate: null, description: null, order: 1 });

    const insertTaskCalls = oracle.execute.mock.calls.filter((c: any[]) => String(c[0]).includes('INSERT INTO "MilestoneTask"'));
    expect(insertTaskCalls).toHaveLength(1);
    expect(insertTaskCalls[0][1]).toMatchObject({ type: 'Bug', priority: 2, order: 5 });
  });

  it('save skips task inserts when a milestone has no tasks array', async () => {
    const initiativeRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
      priority: 1, createdAt: new Date()
    };
    const query: any = jest.fn();
    query.mockResolvedValueOnce([initiativeRow]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleInitiativeRepository(oracle);

    await repo.save({
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1, createdAt: new Date(),
      milestones: [{ name: 'MS', systemId: 's1', baselineDate: '2026-01-01' }]
    } as any);

    const insertTaskCalls = oracle.execute.mock.calls.filter((c: any[]) => String(c[0]).includes('INSERT INTO "MilestoneTask"'));
    expect(insertTaskCalls).toHaveLength(0);
  });

  it('create defaults companyId and departmentId when not provided', async () => {
    const createdRow = { id: 'new-id', title: 'New', companyId: 'default-company', departmentId: 'default-department', status: 'Backlog', priority: 1, createdAt: new Date() };
    const query: any = jest.fn();
    query.mockResolvedValueOnce([createdRow]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleInitiativeRepository(oracle);

    await repo.create({ title: 'New', status: 'Backlog', priority: 1 } as any);

    expect(oracle.execute.mock.calls[0][1]).toMatchObject({ companyId: 'default-company', departmentId: 'default-department' });
  });

  it('create inserts and returns the reloaded initiative', async () => {
    const createdRow = {
      id: 'new-id', title: 'New', companyId: 'c1', departmentId: 'd1', status: 'Backlog',
      priority: 1, createdAt: new Date()
    };
    const query: any = jest.fn();
    query
      .mockResolvedValueOnce([createdRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleInitiativeRepository(oracle);

    const result = await repo.create({ title: 'New', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1 } as any);

    expect(oracle.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "Initiative"'),
      expect.objectContaining({ title: 'New' })
    );
    expect(result.id).toBe('new-id');
  });

  it('create persists the whole payload instead of placeholders', async () => {
    const createdRow = {
      id: 'new-id', title: 'New', companyId: 'c1', departmentId: 'd1', status: '1- Backlog',
      priority: 0, createdAt: new Date()
    };
    const query: any = jest.fn();
    query.mockResolvedValueOnce([createdRow]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const oracle: any = { execute: jest.fn(async () => undefined), query };
    const repo = new OracleInitiativeRepository(oracle);

    await repo.create({
      title: 'New', companyId: 'c1', departmentId: 'd1', status: '1- Backlog', priority: 0,
      type: '2- Projeto', benefit: 'Objetivo', leaderId: 'col-1', createdById: 'u1',
      memberIds: ['col-2'], impactedSystemIds: ['sys-1'], startDate: '2026-08-01', endDate: '2026-09-01'
    } as any);

    expect(oracle.execute.mock.calls[0][1]).toMatchObject({
      type: '2- Projeto', benefit: 'Objetivo', leaderId: 'col-1', createdById: 'u1',
      memberIds: '["col-2"]', impactedSystemIds: '["sys-1"]',
      startDate: '2026-08-01', endDate: '2026-09-01'
    });
  });

  it('create throws when the initiative cannot be reloaded after insert', async () => {
    const oracle: any = { execute: jest.fn(async () => undefined), query: jest.fn(async () => []) };
    const repo = new OracleInitiativeRepository(oracle);

    await expect(
      repo.create({ title: 'X', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1 } as any)
    ).rejects.toThrow('Failed to load created initiative');
  });

  it('save throws when the initiative cannot be reloaded after update', async () => {
    const oracle: any = { execute: jest.fn(async () => undefined), query: jest.fn(async () => []) };
    const repo = new OracleInitiativeRepository(oracle);

    await expect(
      repo.save({ id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1, createdAt: new Date() } as any)
    ).rejects.toThrow('Failed to load updated initiative');
  });

  it('delete removes dependent initiative records before deleting initiative', async () => {
    const oracle: any = {
      execute: jest.fn(async () => undefined),
      query: jest.fn()
    };

    const repo = new OracleInitiativeRepository(oracle as any);
    await repo.delete('i1');

    expect(oracle.execute.mock.calls.map((call: any[]) => String(call[0]))).toEqual([
      expect.stringContaining('DELETE FROM "MilestoneTask"'),
      expect.stringContaining('DELETE FROM "InitiativeComment"'),
      expect.stringContaining('DELETE FROM "InitiativeHistory"'),
      expect.stringContaining('DELETE FROM "InitiativeMilestone"'),
      expect.stringContaining('DELETE FROM "Initiative"')
    ]);
  });

  it('counts initiatives by clientTeamId', async () => {
    const query: any = jest.fn(async () => [{ count: 4 }]);
    const repo = new OracleInitiativeRepository({ execute: jest.fn(), query } as any);
    await expect(repo.countByClientTeamId('ct1')).resolves.toBe(4);
    expect(query.mock.calls[0][1]).toEqual({ clientTeamId: 'ct1' });
  });
});
