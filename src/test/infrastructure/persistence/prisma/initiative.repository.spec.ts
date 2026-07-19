import { describe, expect, it, jest } from '@jest/globals';
import { PrismaInitiativeRepository } from '../../../../infrastructure/persistence/prisma/PrismaInitiativeRepository.js';

describe('PrismaInitiativeRepository', () => {
  it('save persists scalars, history and milestones', async () => {
    const savedRow = {
      id: 'i1',
      title: 'Updated',
      companyId: 'c1',
      departmentId: 'd1',
      type: '2- Projeto',
      benefit: 'B',
      scope: 'S',
      customerOwner: 'Owner',
      originDirectorate: 'Dir',
      leaderId: null,
      technicalLeadId: null,
      impactedSystemIds: [],
      macroScope: [],
      requestDate: null,
      businessExpectationDate: null,
      status: '9- Concluído',
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

    const prisma: any = {
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
      initiative: {
        update: jest.fn(async () => savedRow),
        findUnique: jest.fn(async () => savedRow)
      },
      initiativeHistory: {
        deleteMany: jest.fn(async () => undefined),
        createMany: jest.fn(async () => undefined),
        findMany: jest.fn(async () => [{
          id: 'h1',
          timestamp: new Date('2026-06-21T12:00:00.000Z'),
          user: 'Ana',
          action: 'Save',
          fromStatus: '8- Implantação',
          toStatus: '9- Concluído',
          notes: null,
          initiativeId: 'i1'
        }])
      },
      initiativeMilestone: {
        deleteMany: jest.fn(async () => undefined),
        create: jest.fn(async () => undefined),
        findMany: jest.fn(async () => [{
          id: 'm1',
          name: 'MS 1',
          systemId: 's1',
          baselineDate: '2026-06-01',
          realDate: null,
          description: null,
          assignedEngineerId: null,
          startDate: null,
          order: 0,
          initiativeId: 'i1',
          tasks: [{
            id: 't1',
            name: 'Task 1',
            status: 'Backlog',
            type: null,
            assigneeId: null,
            systemId: null,
            systemIds: [],
            priority: null,
            startDate: null,
            targetDate: null,
            notes: null,
            taskHistory: [],
            order: 0,
            milestoneId: 'm1',
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-01T00:00:00.000Z')
          }]
        }])
      },
      milestoneTask: {
        deleteMany: jest.fn(async () => undefined)
      }
    };

    const repo = new PrismaInitiativeRepository(prisma as any);
    const result = await repo.save({
      id: 'i1',
      title: 'Updated',
      companyId: 'c1',
      departmentId: 'd1',
      status: '9- Concluído',
      priority: 5,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      type: '2- Projeto',
      benefit: 'B',
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

    expect(prisma.initiative.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'i1' },
      data: expect.objectContaining({
        actualEndDate: '2026-06-21',
        title: 'Updated',
        priority: 5
      })
    }));
    expect(prisma.initiativeHistory.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.initiativeMilestone.create).toHaveBeenCalledTimes(1);
    expect(result.history).toHaveLength(1);
    expect(result.milestones).toHaveLength(1);
  });

  it('save throws when the initiative cannot be reloaded after update', async () => {
    const savedRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null,
      businessExpectationDate: null, status: 'Backlog', previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = {
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
      initiative: {
        update: jest.fn(async () => savedRow),
        findUnique: jest.fn(async () => null)
      },
      initiativeHistory: { deleteMany: jest.fn(async () => undefined) },
      initiativeMilestone: { deleteMany: jest.fn(async () => undefined) },
      milestoneTask: { deleteMany: jest.fn(async () => undefined) }
    };

    const repo = new PrismaInitiativeRepository(prisma as any);

    await expect(
      repo.save({ id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1, createdAt: new Date() } as any)
    ).rejects.toThrow('Failed to load updated initiative');
  });

  it('listByScope filters by companyId and departmentId and maps rows', async () => {
    const row = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null,
      businessExpectationDate: null, status: 'Backlog', previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = { initiative: { findMany: jest.fn(async () => [row]) } };
    const repo = new PrismaInitiativeRepository(prisma as any);

    const result = await repo.listByScope({ companyId: 'c1', departmentId: 'd1' });

    expect(result).toHaveLength(1);
    expect(prisma.initiative.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'c1', departmentId: 'd1' } })
    );
  });

  it('listByScope with no scope queries without filters', async () => {
    const prisma: any = { initiative: { findMany: jest.fn(async () => []) } };
    const repo = new PrismaInitiativeRepository(prisma as any);

    await repo.listByScope({});

    expect(prisma.initiative.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('findById returns null when the initiative row is missing', async () => {
    const prisma: any = { initiative: { findUnique: jest.fn(async () => null) } };
    const repo = new PrismaInitiativeRepository(prisma as any);

    expect(await repo.findById('missing')).toBeNull();
  });

  it('findById normalizes json array fields in varied shapes', async () => {
    const row = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null,
      businessExpectationDate: null, status: 'Backlog', previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = {
      initiative: { findUnique: jest.fn(async () => row) },
      initiativeHistory: { findMany: jest.fn(async () => []) },
      initiativeMilestone: {
        findMany: jest.fn(async () => [{
          id: 'm1', name: 'MS', systemId: 's1', baselineDate: '2026-06-01', realDate: null,
          description: null, assignedEngineerId: null, startDate: null, order: 0, initiativeId: 'i1',
          tasks: [
            { id: 't1', name: 'T1', status: 'Backlog', type: null, assigneeId: null, systemId: null, systemIds: null, priority: null, startDate: null, targetDate: null, notes: null, taskHistory: null, order: 0, milestoneId: 'm1', createdAt: new Date(), updatedAt: new Date() },
            { id: 't2', name: 'T2', status: 'Backlog', type: null, assigneeId: null, systemId: null, systemIds: '["s1"]', priority: null, startDate: null, targetDate: null, notes: null, taskHistory: '[{"a":1}]', order: 1, milestoneId: 'm1', createdAt: new Date(), updatedAt: new Date() },
            { id: 't3', name: 'T3', status: 'Backlog', type: null, assigneeId: null, systemId: null, systemIds: 'not-json{', priority: null, startDate: null, targetDate: null, notes: null, taskHistory: '"not-array"', order: 2, milestoneId: 'm1', createdAt: new Date(), updatedAt: new Date() },
            { id: 't4', name: 'T4', status: 'Backlog', type: null, assigneeId: null, systemId: null, systemIds: 999, priority: null, startDate: null, targetDate: null, notes: null, taskHistory: 999, order: 3, milestoneId: 'm1', createdAt: new Date(), updatedAt: new Date() }
          ]
        }])
      }
    };
    const repo = new PrismaInitiativeRepository(prisma as any);

    const result = await repo.findById('i1');
    const tasks = (result?.milestones as any)[0].tasks;

    expect(tasks[0].systemIds).toEqual([]);
    expect(tasks[0].taskHistory).toEqual([]);
    expect(tasks[1].systemIds).toEqual(['s1']);
    expect(tasks[1].taskHistory).toEqual([{ a: 1 }]);
    expect(tasks[2].systemIds).toEqual([]);
    expect(tasks[2].taskHistory).toEqual([]);
    expect(tasks[3].systemIds).toEqual([]);
    expect(tasks[3].taskHistory).toEqual([]);
  });

  it('mapToDomain falls back to Backlog status and empty arrays for non-array fields', async () => {
    const row = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: null, macroScope: null, requestDate: null,
      businessExpectationDate: null, status: null, previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: null, startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = { initiative: { findMany: jest.fn(async () => [row]) } };
    const repo = new PrismaInitiativeRepository(prisma as any);

    const result = await repo.listByScope({});

    expect(result[0].status).toBe('Backlog');
    expect(result[0].impactedSystemIds).toEqual([]);
    expect(result[0].macroScope).toEqual([]);
    expect(result[0].memberIds).toEqual([]);
  });

  it('findById maps populated milestone and history fields', async () => {
    const row = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null,
      businessExpectationDate: null, status: 'Backlog', previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = {
      initiative: { findUnique: jest.fn(async () => row) },
      initiativeHistory: {
        findMany: jest.fn(async () => [{
          id: 'h1', timestamp: new Date('2026-01-01T00:00:00.000Z'), user: 'Ana', action: 'Save',
          fromStatus: 'A', toStatus: 'B', notes: 'note', initiativeId: 'i1'
        }])
      },
      initiativeMilestone: {
        findMany: jest.fn(async () => [{
          id: 'm1', name: 'MS', systemId: 's1', baselineDate: '2026-01-01',
          realDate: '2026-01-05', description: 'Desc', assignedEngineerId: 'E1', startDate: '2026-01-01',
          order: 2, initiativeId: 'i1', tasks: []
        }])
      }
    };
    const repo = new PrismaInitiativeRepository(prisma as any);

    const result = await repo.findById('i1');

    expect((result?.milestones as any)[0].realDate).toBe('2026-01-05');
    expect((result?.milestones as any)[0].description).toBe('Desc');
    expect((result?.history as any)[0].fromStatus).toBe('A');
    expect((result?.history as any)[0].notes).toBe('note');
  });

  it('save persists populated history/milestone/task fields and skips tasks array when absent', async () => {
    const savedRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null,
      businessExpectationDate: null, status: 'Backlog', previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = {
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
      initiative: {
        update: jest.fn(async () => savedRow),
        findUnique: jest.fn(async () => savedRow)
      },
      initiativeHistory: {
        deleteMany: jest.fn(async () => undefined),
        createMany: jest.fn(async () => undefined),
        findMany: jest.fn(async () => [])
      },
      initiativeMilestone: {
        deleteMany: jest.fn(async () => undefined),
        create: jest.fn(async () => undefined),
        findMany: jest.fn(async () => [])
      },
      milestoneTask: { deleteMany: jest.fn(async () => undefined) }
    };

    const repo = new PrismaInitiativeRepository(prisma as any);
    await repo.save({
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1, createdAt: new Date(),
      history: [{ fromStatus: 'A', toStatus: 'B', notes: 'note', user: 'Ana', action: 'Save', timestamp: '2026-01-01T00:00:00.000Z' }],
      milestones: [
        {
          name: 'MS', systemId: 's1', baselineDate: '2026-01-01', realDate: '2026-01-05',
          description: 'Desc', assignedEngineerId: 'E1', startDate: '2026-01-01', order: 3,
          tasks: [{ name: 'T1', type: 'Bug', assigneeId: 'A1', systemId: 'S1', systemIds: ['s1'], priority: 2, startDate: '2026-01-01', targetDate: '2026-01-05', notes: 'note', taskHistory: [{ a: 1 }], order: 5 }]
        },
        { name: 'MS2', systemId: 's2', baselineDate: '2026-01-01' }
      ]
    } as any);

    const createCalls = (prisma.initiativeMilestone.create as any).mock.calls;
    expect(createCalls[0][0].data).toMatchObject({ realDate: '2026-01-05', description: 'Desc', order: 3 });
    expect(createCalls[0][0].data.tasks.create[0]).toMatchObject({ type: 'Bug', priority: 2, order: 5 });
    expect(createCalls[1][0].data).toMatchObject({ realDate: null, description: null, order: 1 });
    expect(createCalls[1][0].data.tasks).toBeUndefined();

    const historyCall = (prisma.initiativeHistory.createMany as any).mock.calls[0][0];
    expect(historyCall.data[0]).toMatchObject({ fromStatus: 'A', toStatus: 'B', notes: 'note' });
  });

  it('save skips history insert when history is empty', async () => {
    const savedRow = {
      id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null,
      businessExpectationDate: null, status: 'Backlog', previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = {
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
      initiative: { update: jest.fn(async () => savedRow), findUnique: jest.fn(async () => savedRow) },
      initiativeHistory: { deleteMany: jest.fn(async () => undefined), createMany: jest.fn(async () => undefined), findMany: jest.fn(async () => []) },
      initiativeMilestone: { deleteMany: jest.fn(async () => undefined), findMany: jest.fn(async () => []) },
      milestoneTask: { deleteMany: jest.fn(async () => undefined) }
    };

    const repo = new PrismaInitiativeRepository(prisma as any);
    await repo.save({ id: 'i1', title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1, createdAt: new Date(), history: [], milestones: [] } as any);

    expect(prisma.initiativeHistory.createMany).not.toHaveBeenCalled();
  });

  it('create defaults companyId and departmentId when not provided', async () => {
    const row = {
      id: 'new-id', title: 'New', companyId: 'default-company', departmentId: 'default-department', type: 'General',
      benefit: 'N/A', benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null, businessExpectationDate: null,
      status: 'Backlog', previousStatus: null, executingTeamId: null, executingDirectorate: null, rationale: null,
      externalLinkType: null, externalLinkName: null, externalLinkUrl: null, createdById: null, assignedManagerId: null,
      initiativeType: null, memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = { initiative: { create: jest.fn(async () => row) } };
    const repo = new PrismaInitiativeRepository(prisma as any);

    await repo.create({ title: 'New', status: 'Backlog', priority: 1 } as any);

    expect(prisma.initiative.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: 'default-company', departmentId: 'default-department' }) })
    );
  });

  it('create inserts and maps the new initiative', async () => {
    const row = {
      id: 'new-id', title: 'New', companyId: 'c1', departmentId: 'd1', type: 'General', benefit: 'N/A',
      benefitType: null, scope: 'N/A', customerOwner: 'N/A', originDirectorate: 'N/A', leaderId: null,
      technicalLeadId: null, impactedSystemIds: [], macroScope: [], requestDate: null,
      businessExpectationDate: null, status: 'Backlog', previousStatus: null, executingTeamId: null,
      executingDirectorate: null, rationale: null, externalLinkType: null, externalLinkName: null,
      externalLinkUrl: null, createdById: null, assignedManagerId: null, initiativeType: null,
      memberIds: [], startDate: null, endDate: null, actualEndDate: null, priority: 1, createdAt: new Date()
    };
    const prisma: any = { initiative: { create: jest.fn(async () => row) } };
    const repo = new PrismaInitiativeRepository(prisma as any);

    const result = await repo.create({ title: 'New', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 1 } as any);

    expect(result.id).toBe('new-id');
    expect(prisma.initiative.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'New', companyId: 'c1', departmentId: 'd1' }) })
    );
  });

  it('delete removes dependent initiative records before deleting initiative', async () => {
    const prisma: any = {
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
      initiative: {
        update: jest.fn(),
        delete: jest.fn(async () => undefined),
        findUnique: jest.fn()
      },
      initiativeHistory: {
        deleteMany: jest.fn(async () => undefined),
        createMany: jest.fn()
      },
      initiativeMilestone: {
        deleteMany: jest.fn(async () => undefined),
        create: jest.fn()
      },
      initiativeComment: {
        deleteMany: jest.fn(async () => undefined)
      },
      milestoneTask: {
        deleteMany: jest.fn(async () => undefined)
      }
    };

    const repo = new PrismaInitiativeRepository(prisma as any);
    await repo.delete('i1');

    expect(prisma.milestoneTask.deleteMany).toHaveBeenCalledWith({
      where: { milestone: { initiativeId: 'i1' } }
    });
    expect(prisma.initiativeComment.deleteMany).toHaveBeenCalledWith({
      where: { initiativeId: 'i1' }
    });
    expect(prisma.initiativeHistory.deleteMany).toHaveBeenCalledWith({
      where: { initiativeId: 'i1' }
    });
    expect(prisma.initiativeMilestone.deleteMany).toHaveBeenCalledWith({
      where: { initiativeId: 'i1' }
    });
    expect(prisma.initiative.delete).toHaveBeenCalledWith({
      where: { id: 'i1' }
    });
  });

  it('counts initiatives by clientTeamId', async () => {
    const count = jest.fn(async (_args: unknown) => 3);
    const repo = new PrismaInitiativeRepository({ initiative: { count } } as any);
    await expect(repo.countByClientTeamId('ct1')).resolves.toBe(3);
    expect(count).toHaveBeenCalledWith({ where: { clientTeamId: 'ct1' } });
  });
});
