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
});
