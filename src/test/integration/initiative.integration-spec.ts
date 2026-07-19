import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { PrismaInitiativeRepository } from '../../infrastructure/persistence/prisma/PrismaInitiativeRepository.js';
import { createTestPrismaClient, truncateAll } from './bootstrap.js';

describe('PrismaInitiativeRepository against a real Postgres (integration)', () => {
  let prisma: PrismaClient;
  let repo: PrismaInitiativeRepository;
  let companyId: string;
  let departmentId: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
    repo = new PrismaInitiativeRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await truncateAll(prisma);
  });

  async function seedCompanyAndDepartment(): Promise<void> {
    const company = await prisma.company.create({ data: { fantasyName: 'Acme', realName: 'Acme Inc', logo: '', description: '' } });
    const department = await prisma.department.create({ data: { name: 'Eng', companyId: company.id } });
    companyId = company.id;
    departmentId = department.id;
  }

  it('rejects create() default fallback companyId/departmentId against the real FK constraint', async () => {
    await expect(
      repo.create({ title: 'No scope', status: 'Backlog', priority: 1 } as any)
    ).rejects.toThrow();
  });

  it('creates an initiative, then saves milestones/tasks/history and reloads them via real joins', async () => {
    await seedCompanyAndDepartment();

    const created = await repo.create({ title: 'Nova iniciativa', status: 'Backlog', priority: 1, companyId, departmentId } as any);
    expect(created.id).toBeTruthy();

    const found = await repo.findById(created.id);
    expect(found?.title).toBe('Nova iniciativa');
    expect(found?.milestones).toEqual([]);
    expect(found?.history).toEqual([]);

    const saved = await repo.save({
      ...created,
      title: 'Atualizada',
      history: [{ user: 'Ana', action: 'Save', fromStatus: 'Backlog', toStatus: 'In Progress' }],
      milestones: [
        {
          name: 'MS 1', systemId: 's1', baselineDate: '2026-01-01',
          tasks: [{ name: 'Task 1', status: 'Backlog', systemIds: ['s1'], taskHistory: [{ note: 'x' }] }]
        }
      ]
    } as any);

    expect(saved.title).toBe('Atualizada');
    expect(saved.history).toHaveLength(1);
    expect(saved.milestones).toHaveLength(1);
    expect((saved.milestones as any)[0].tasks).toHaveLength(1);
    expect((saved.milestones as any)[0].tasks[0].systemIds).toEqual(['s1']);
  });

  it('deletes an initiative and cascades milestones/tasks/history/comments (real cascade)', async () => {
    await seedCompanyAndDepartment();
    const created = await repo.create({ title: 'To delete', status: 'Backlog', priority: 1, companyId, departmentId } as any);
    await repo.save({
      ...created,
      milestones: [{ name: 'MS', systemId: 's1', baselineDate: '2026-01-01', tasks: [{ name: 'T1', status: 'Backlog' }] }],
      history: [{ user: 'Ana', action: 'Create' }]
    } as any);

    await repo.delete(created.id);

    expect(await repo.findById(created.id)).toBeNull();
    const remainingMilestones = await prisma.initiativeMilestone.count({ where: { initiativeId: created.id } });
    const remainingTasks = await prisma.milestoneTask.count({ where: { milestone: { initiativeId: created.id } } });
    const remainingHistory = await prisma.initiativeHistory.count({ where: { initiativeId: created.id } });
    expect(remainingMilestones).toBe(0);
    expect(remainingTasks).toBe(0);
    expect(remainingHistory).toBe(0);
  });

  it('filters listByScope by real companyId/departmentId WHERE clause', async () => {
    await seedCompanyAndDepartment();
    await repo.create({ title: 'A', status: 'Backlog', priority: 1, companyId, departmentId } as any);

    const other = await prisma.company.create({ data: { fantasyName: 'Other', realName: 'Other Inc', logo: '', description: '' } });
    const otherDept = await prisma.department.create({ data: { name: 'Other Dept', companyId: other.id } });
    await repo.create({ title: 'B', status: 'Backlog', priority: 1, companyId: other.id, departmentId: otherDept.id } as any);

    const scoped = await repo.listByScope({ companyId });
    expect(scoped).toHaveLength(1);
    expect(scoped[0]?.title).toBe('A');
  });

  it('enforces the ClientTeam FK and resolves the current name after a rename', async () => {
    await seedCompanyAndDepartment();
    const team = await prisma.clientTeam.create({
      data: { name: 'Operação - FTTH', companyId, departmentId }
    });
    const created = await repo.create({
      title: 'Com área', status: 'Backlog', priority: 1,
      companyId, departmentId, clientTeamId: team.id
    } as any);

    expect(created.clientTeamId).toBe(team.id);
    expect(created.originDirectorate).toBe('Operação - FTTH');

    await prisma.clientTeam.update({ where: { id: team.id }, data: { name: 'Operações e Engenharia' } });
    const renamed = await repo.findById(created.id);
    expect(renamed?.clientTeamId).toBe(team.id);
    expect(renamed?.originDirectorate).toBe('Operações e Engenharia');

    await expect(prisma.clientTeam.delete({ where: { id: team.id } })).rejects.toThrow();
    await expect(repo.create({
      title: 'FK inválida', status: 'Backlog', priority: 1,
      companyId, departmentId, clientTeamId: '00000000-0000-0000-0000-000000000000'
    } as any)).rejects.toThrow();
  });
});
