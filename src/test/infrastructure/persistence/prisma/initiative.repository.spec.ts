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
});
