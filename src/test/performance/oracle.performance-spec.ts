import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ConfigModule } from '@nestjs/config';
import { OracleService } from '../../infrastructure/persistence/oracle/oracle.service.js';
import { OracleInitiativeRepository } from '../../infrastructure/persistence/oracle/OracleInitiativeRepository.js';
import { OracleBusinessUnitRepository } from '../../infrastructure/persistence/oracle/OracleBusinessUnitRepository.js';
import { OracleClientTeamRepository } from '../../infrastructure/persistence/oracle/OracleClientTeamRepository.js';
import type { Initiative } from '../../domain/entities/Initiative.js';
import { PerfTimer, concurrentRequests } from './perf.utils.js';
import { envConfig } from '../../config/env.config.js';
import { randomUUID } from 'node:crypto';

describe('[ORACLE PERFORMANCE] Integration Tests', () => {
  let module: TestingModule;
  let initiativeRepo: OracleInitiativeRepository;
  let perfTimer: PerfTimer;

  const SLA_SINGLE_OP = 50;
  const SLA_BULK_OP = 100;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [envConfig] })],
      providers: [OracleService, OracleInitiativeRepository, OracleBusinessUnitRepository, OracleClientTeamRepository]
    }).compile();

    initiativeRepo = module.get<OracleInitiativeRepository>(OracleInitiativeRepository);
    perfTimer = new PerfTimer();
  });

  afterAll(async () => {
    await module.close();
  });

  // ============================================================================
  // CRUD Performance Tests
  // ============================================================================

  describe('CRUD Operations - Initiative', () => {
    const testCompanyId = 'perf-test-company';
    const testDepartmentId = 'perf-test-department';
    let createdInitiativeId: string;

    it('should measure CREATE latency (single record)', async () => {
      const payload: Omit<Initiative, 'id' | 'createdAt'> = {
        title: `[PERF] Initiative ${randomUUID()}`,
        companyId: testCompanyId,
        departmentId: testDepartmentId,
        status: 'Backlog',
        priority: 1
      };

      const { result, measure } = await perfTimer.trackAsync(
        'CREATE Single Initiative',
        'create',
        () => initiativeRepo.create(payload),
        SLA_SINGLE_OP,
        { recordCount: 1 }
      );

      createdInitiativeId = result.id;
      expect(measure.duration).toBeLessThan(SLA_SINGLE_OP);
      expect(result.id).toBeDefined();
    });

    it('should measure READ latency (findById)', async () => {
      const { measure } = await perfTimer.trackAsync(
        'READ Single Initiative by ID',
        'read',
        () => initiativeRepo.findById(createdInitiativeId),
        SLA_SINGLE_OP,
        { recordCount: 1 }
      );

      expect(measure.duration).toBeLessThan(SLA_SINGLE_OP);
    });

    it('should measure UPDATE latency (single record)', async () => {
      const initiative = await initiativeRepo.findById(createdInitiativeId);
      expect(initiative).toBeDefined();

      const updated: Initiative = {
        ...initiative!,
        title: `[PERF UPDATED] ${initiative!.title}`,
        status: 'In Progress'
      };

      const { measure } = await perfTimer.trackAsync(
        'UPDATE Single Initiative',
        'update',
        () => initiativeRepo.save(updated),
        SLA_SINGLE_OP,
        { recordCount: 1 }
      );

      expect(measure.duration).toBeLessThan(SLA_SINGLE_OP);
    });

    it('should measure DELETE latency (single record)', async () => {
      const { measure } = await perfTimer.trackAsync(
        'DELETE Single Initiative',
        'delete',
        () => initiativeRepo.delete(createdInitiativeId),
        SLA_SINGLE_OP,
        { recordCount: 1 }
      );

      expect(measure.duration).toBeLessThan(SLA_SINGLE_OP);
    });
  });

  // ============================================================================
  // Bulk Operations Performance Tests
  // ============================================================================

  describe('Bulk Operations', () => {
    const testCompanyId = 'perf-bulk-company';
    const testDepartmentId = 'perf-bulk-department';
    const createdIds: string[] = [];

    it('should measure CREATE latency for 10 records sequentially', async () => {
      const count = 10;
      const { result, measure } = await perfTimer.trackAsync(
        `CREATE ${count} Initiatives (sequential)`,
        'create_bulk_seq',
        async () => {
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            const result = await initiativeRepo.create({
              title: `[PERF BULK SEQ] Initiative ${i} ${randomUUID()}`,
              companyId: testCompanyId,
              departmentId: testDepartmentId,
              status: 'Backlog',
              priority: i
            });
            ids.push(result.id);
          }
          return ids;
        },
        SLA_BULK_OP,
        { recordCount: count, mode: 'sequential' }
      );

      createdIds.push(...result);
      expect(measure.duration).toBeLessThan(SLA_BULK_OP * count); // Allow cumulative
    });

    it('should measure CREATE latency for 5 records in parallel', async () => {
      const count = 5;
      const { measure } = await perfTimer.trackAsync(
        `CREATE ${count} Initiatives (parallel)`,
        'create_bulk_parallel',
        () =>
          concurrentRequests(count, async () =>
            initiativeRepo.create({
              title: `[PERF BULK PAR] Initiative ${randomUUID()}`,
              companyId: testCompanyId,
              departmentId: testDepartmentId,
              status: 'Backlog',
              priority: Math.random()
            })
          ),
        SLA_BULK_OP,
        { recordCount: count, mode: 'parallel' }
      );

      expect(measure.duration).toBeLessThan(SLA_BULK_OP * 2); // Parallel should be faster
    });

    it('should measure LIST latency (listByScope with 50+ records)', async () => {
      const scope = { companyId: testCompanyId, departmentId: testDepartmentId };

      const { measure } = await perfTimer.trackAsync(
        'LIST Initiatives (listByScope)',
        'read_list',
        () => initiativeRepo.listByScope(scope),
        SLA_BULK_OP,
        { mode: 'listByScope' }
      );

      expect(measure.duration).toBeLessThan(SLA_BULK_OP);
    });
  });

  // ============================================================================
  // Connection Pool Performance Tests
  // ============================================================================

  describe('Connection Pool Behavior', () => {
    it('should measure concurrent single-record operations (10 parallel)', async () => {
      const concurrency = 10;
      const { measure } = await perfTimer.trackAsync(
        `Concurrent READ (${concurrency} parallel)`,
        'pool_concurrent_read',
        async () => {
          // First, create a test initiative to read
          const initiative = await initiativeRepo.create({
            title: `[PERF POOL] Test Initiative ${randomUUID()}`,
            companyId: 'perf-pool-company',
            departmentId: 'perf-pool-dept',
            status: 'Backlog',
            priority: 1
          });

          const results = await concurrentRequests(concurrency, () => initiativeRepo.findById(initiative.id));
          return results;
        },
        SLA_BULK_OP,
        { concurrency }
      );

      expect(measure.duration).toBeLessThan(SLA_BULK_OP * 2);
    });

    it('should measure concurrent mixed operations (reads + writes)', async () => {
      const concurrency = 5;
      const { measure } = await perfTimer.trackAsync(
        `Concurrent Mixed Ops (${concurrency} parallel)`,
        'pool_concurrent_mixed',
        async () => {
          const results = await Promise.all([
            // Writes
            ...Array.from({ length: 2 }, () =>
              initiativeRepo.create({
                title: `[PERF MIXED] Initiative ${randomUUID()}`,
                companyId: 'perf-mixed-company',
                departmentId: 'perf-mixed-dept',
                status: 'Backlog',
                priority: Math.random()
              })
            ),
            // Reads
            ...Array.from({ length: 3 }, () => initiativeRepo.listByScope({ companyId: 'perf-mixed-company' }))
          ]);
          return results;
        },
        SLA_BULK_OP,
        { concurrency, mode: 'mixed' }
      );

      expect(measure.duration).toBeLessThan(SLA_BULK_OP * 2);
    });
  });

  // ============================================================================
  // Query Complexity Performance Tests
  // ============================================================================

  describe('Query Complexity - Deep Objects', () => {
    it('should measure latency of Initiative with deep hierarchy (milestones + tasks)', async () => {
      // Create initiative with milestones and tasks
      const initiative = await initiativeRepo.create({
        title: `[PERF DEEP] Initiative ${randomUUID()}`,
        companyId: 'perf-deep-company',
        departmentId: 'perf-deep-dept',
        status: 'Backlog',
        priority: 1,
        milestones: [
          {
            id: randomUUID(),
            name: 'Milestone 1',
            systemId: 'sys-1',
            baselineDate: '2025-12-31',
            tasks: [
              { id: randomUUID(), name: 'Task 1', status: 'Backlog', order: 0, milestoneId: '' },
              { id: randomUUID(), name: 'Task 2', status: 'Backlog', order: 1, milestoneId: '' },
              { id: randomUUID(), name: 'Task 3', status: 'Backlog', order: 2, milestoneId: '' }
            ]
          },
          {
            id: randomUUID(),
            name: 'Milestone 2',
            systemId: 'sys-2',
            baselineDate: '2026-06-30',
            tasks: [
              { id: randomUUID(), name: 'Task 4', status: 'Backlog', order: 0, milestoneId: '' },
              { id: randomUUID(), name: 'Task 5', status: 'Backlog', order: 1, milestoneId: '' }
            ]
          }
        ]
      } as any);

      const { measure } = await perfTimer.trackAsync(
        'READ Deep Initiative (with milestones + tasks)',
        'read_deep',
        () => initiativeRepo.findById(initiative.id),
        SLA_BULK_OP,
        { complexity: 'deep', milestones: 2, tasks: 5 }
      );

      expect(measure.duration).toBeLessThan(SLA_BULK_OP);
    });
  });

  // ============================================================================
  // Performance Report
  // ============================================================================

  afterAll(() => {
    perfTimer.printReport();
    const report = perfTimer.getReport();

    // Export report to JSON for CI/CD integration
    const fs = require('fs');
    const reportPath = './test-results/oracle-performance-report.json';
    fs.mkdirSync('./test-results', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    if (report.summary.failed > 0) {
      console.error(`\n❌ ${report.summary.failed} performance tests failed SLA`);
      process.exitCode = 1;
    } else {
      console.log(`\n✅ All performance tests passed SLA`);
    }
  });
});
