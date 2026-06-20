import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { sanitizeInitiativeDto } from '../dto/initiativeDto.js';
import type { OracleRuntime } from '../../../infrastructure/persistence/oracle.runtime.js';

interface InitiativesControllerDeps {
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  provider: 'supabase' | 'oracle';
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  getCachedState: <T>(key: string) => { value: T; stale: boolean } | null;
  isRefreshing: (key: string) => boolean;
  markRefreshing: (key: string, refreshing: boolean) => void;
  singleflight: <T>(key: string, factory: () => Promise<T>) => Promise<T>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  normalizeMilestoneOrder: (order: unknown, fallback?: number) => number;
  normalizeTaskOrder: (order: unknown, fallback?: number) => number;
  getCommonWhere: (req: any) => Record<string, string>;
}

export function createInitiativesController(deps: InitiativesControllerDeps) {
  const {
    prisma,
    oracle,
    provider,
    buildCacheKey,
    getCachedState,
    isRefreshing,
    markRefreshing,
    singleflight,
    setCached,
    invalidateCacheByPrefix,
    serveSWR,
    normalizeMilestoneOrder,
    normalizeTaskOrder,
    getCommonWhere
  } = deps;

  const normalizeLeaderId = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const writeNotSupported = (res: any, scope: string) => {
    return res.status(501).json({
      error: `${scope} is not implemented for DB_PROVIDER=${provider} yet`
    });
  };

  const asJsonArray = (value: unknown): string => JSON.stringify(Array.isArray(value) ? value : []);

  const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((v): v is string => typeof v === 'string');
        }
      } catch {
        return [];
      }
    }

    return [];
  };

  const parseUnknownArray = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const normalizeInitiativeOracle = (initiative: Record<string, unknown>) => ({
    ...initiative,
    impactedSystemIds: parseStringArray(initiative.impactedSystemIds),
    macroScope: parseStringArray(initiative.macroScope),
    memberIds: parseStringArray(initiative.memberIds)
  });

  const normalizeMilestoneTaskOracle = (task: Record<string, unknown>) => ({
    ...task,
    taskHistory: parseUnknownArray(task.taskHistory),
    systemIds: parseStringArray(task.systemIds)
  });

  const fetchInitiativeDetailOracle = async (id: string) => {
    if (!oracle) {
      throw new Error(`Initiatives are not implemented for DB_PROVIDER=${provider}`);
    }

    const baseRows = await oracle.query<Record<string, unknown>>(
      'SELECT * FROM "Initiative" WHERE "id" = :id',
      { id }
    );

    const base = baseRows[0];
    if (!base) return null;

    const milestones = await oracle.query<Record<string, unknown>>(
      `
        SELECT *
        FROM "InitiativeMilestone"
        WHERE "initiativeId" = :id
        ORDER BY "order" ASC
      `,
      { id }
    );

    const milestoneIds = milestones.map(m => String(m.id));
    let tasks: Array<Record<string, unknown>> = [];
    if (milestoneIds.length > 0) {
      tasks = await oracle.query<Record<string, unknown>>(
        `
          SELECT *
          FROM "MilestoneTask"
          WHERE "milestoneId" IN (${milestoneIds.map((_, idx) => `:m${idx}`).join(', ')})
          ORDER BY "order" ASC
        `,
        Object.fromEntries(milestoneIds.map((value, idx) => [`m${idx}`, value]))
      );
    }

    const comments = await oracle.query<Record<string, unknown>>(
      `
        SELECT *
        FROM "InitiativeComment"
        WHERE "initiativeId" = :id
        ORDER BY "timestamp" DESC
      `,
      { id }
    );

    const history = await oracle.query<Record<string, unknown>>(
      `
        SELECT *
        FROM "InitiativeHistory"
        WHERE "initiativeId" = :id
        ORDER BY "timestamp" DESC
      `,
      { id }
    );

    return {
      ...normalizeInitiativeOracle(base),
      milestones: milestones.map(m => ({
        ...m,
        tasks: tasks
          .filter(t => String(t.milestoneId) === String(m.id))
          .map(normalizeMilestoneTaskOracle)
      })),
      comments,
      history
    };
  };

  const getInitiatives = async (req: any, res: any) => {
    try {
      const lite = String(req.query.lite || 'false').toLowerCase() === 'true';
      const where = getCommonWhere(req);
      const cacheKey = buildCacheKey('initiatives', { ...where, lite });

      const fetchFresh = async () => {
        const queryStart = Date.now();
        if (prisma && lite) {
          const initiatives = await prisma.initiative.findMany({
            where,
            orderBy: { createdAt: 'desc' }
          });
          const queryMs = Date.now() - queryStart;
          console.log('Found', initiatives.length, 'initiatives', `| dbQueryMs=${queryMs}`, '| lite=true');
          setCached(cacheKey, initiatives);
          return initiatives;
        }

        if (!prisma) {
          if (!oracle) {
            throw new Error(`Initiatives are not implemented for DB_PROVIDER=${provider}`);
          }

          const initiatives = await oracle.query<Record<string, unknown>>(
            `
              SELECT
                "id",
                "companyId",
                "departmentId",
                "title",
                "type",
                "benefit",
                "benefitType",
                "scope",
                "customerOwner",
                "originDirectorate",
                "leaderId",
                "technicalLeadId",
                "impactedSystemIds",
                "createdAt",
                "requestDate",
                "businessExpectationDate",
                "status",
                "previousStatus",
                "executingTeamId",
                "executingDirectorate",
                "rationale",
                "externalLinkType",
                "externalLinkName",
                "externalLinkUrl",
                "macroScope",
                "createdById",
                "assignedManagerId",
                "initiativeType",
                "priority",
                "memberIds",
                "startDate",
                "endDate",
                "actualEndDate"
              FROM "Initiative"
              WHERE (:companyId IS NULL OR "companyId" = :companyId)
                AND (:departmentId IS NULL OR "departmentId" = :departmentId)
              ORDER BY "createdAt" DESC
            `,
            {
              companyId: where.companyId ?? null,
              departmentId: where.departmentId ?? null
            }
          );

          const normalizedInitiatives = initiatives.map(normalizeInitiativeOracle);

          const payload = lite
            ? normalizedInitiatives
            : normalizedInitiatives.map(it => ({
                ...it,
                _progress: { tasksTotal: 0, tasksDone: 0 }
              }));

          const queryMs = Date.now() - queryStart;
          console.log('Found', payload.length, 'initiatives', `| dbQueryMs=${queryMs}`, `| lite=${lite}`);
          setCached(cacheKey, payload);
          return payload;
        }

        const [initiatives, progressRows] = await Promise.all([
          prisma.initiative.findMany({ where, orderBy: { createdAt: 'desc' } }),
          prisma.$queryRaw<Array<{ initiativeId: string; tasksTotal: bigint; tasksDone: bigint }>>`
            SELECT m."initiativeId" AS "initiativeId",
                   COUNT(t.id)::bigint AS "tasksTotal",
                   COUNT(t.id) FILTER (WHERE t.status = 'Done')::bigint AS "tasksDone"
            FROM "public"."InitiativeMilestone" m
            LEFT JOIN "public"."MilestoneTask" t ON t."milestoneId" = m.id
            WHERE m."initiativeId" IN (
              SELECT id FROM "public"."Initiative"
              WHERE (${where.companyId ?? null}::text IS NULL OR "companyId" = ${where.companyId ?? null}::text)
                AND (${where.departmentId ?? null}::text IS NULL OR "departmentId" = ${where.departmentId ?? null}::text)
            )
            GROUP BY m."initiativeId"
          `
        ]);
        const progressMap = new Map<string, { tasksTotal: number; tasksDone: number }>();
        for (const row of progressRows) {
          progressMap.set(row.initiativeId, {
            tasksTotal: Number(row.tasksTotal),
            tasksDone: Number(row.tasksDone)
          });
        }
        const enriched = initiatives.map(it => ({
          ...it,
          _progress: progressMap.get(it.id) || { tasksTotal: 0, tasksDone: 0 }
        }));
        const queryMs = Date.now() - queryStart;
        console.log('Found', enriched.length, 'initiatives', `| dbQueryMs=${queryMs}`, '| lite=false');
        setCached(cacheKey, enriched);
        return enriched;
      };

      const state = getCachedState<any[]>(cacheKey);
      if (state) {
        if (state.stale && !isRefreshing(cacheKey)) {
          markRefreshing(cacheKey, true);
          singleflight(cacheKey, fetchFresh)
            .catch(err => console.error('SWR refresh failed for', cacheKey, err))
            .finally(() => markRefreshing(cacheKey, false));
        }
        console.log('Found', state.value.length, 'initiatives', `| cacheHit=true${state.stale ? ' stale' : ''}`, `| lite=${lite}`);
        return res.json(state.value);
      }
      const fresh = await singleflight(cacheKey, fetchFresh);
      return res.json(fresh);
    } catch (error) {
      console.error('API Error /api/initiatives [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch initiatives' });
    }
  };

  const getInitiativeById = async (req: any, res: any) => {
    const { id } = req.params;
    const cacheKey = buildCacheKey('initiatives', { detail: id });
    try {
      const state = getCachedState<any>(cacheKey);
      const fetchFresh = async () => {
        const queryStart = Date.now();
        let initiative: any = null;

        if (prisma) {
          initiative = await prisma.initiative.findUnique({
            where: { id },
            include: {
              milestones: {
                orderBy: { order: 'asc' },
                include: {
                  tasks: {
                    orderBy: { order: 'asc' },
                    omit: { taskHistory: true }
                  }
                }
              },
              comments: { orderBy: { timestamp: 'desc' } }
            }
          });
        } else {
          if (!oracle) {
            throw new Error(`Initiatives are not implemented for DB_PROVIDER=${provider}`);
          }

          const baseRows = await oracle.query<Record<string, unknown>>(
            'SELECT * FROM "Initiative" WHERE "id" = :id',
            { id }
          );

          const base = baseRows[0];
          if (base) {
            const milestones = await oracle.query<Record<string, unknown>>(
              `
                SELECT *
                FROM "InitiativeMilestone"
                WHERE "initiativeId" = :id
                ORDER BY "order" ASC
              `,
              { id }
            );

            const milestoneIds = milestones.map(m => String(m.id));
            let tasks: Array<Record<string, unknown>> = [];
            if (milestoneIds.length > 0) {
              tasks = await oracle.query<Record<string, unknown>>(
                `
                  SELECT *
                  FROM "MilestoneTask"
                  WHERE "milestoneId" IN (${milestoneIds.map((_, idx) => `:m${idx}`).join(', ')})
                  ORDER BY "order" ASC
                `,
                Object.fromEntries(milestoneIds.map((value, idx) => [`m${idx}`, value]))
              );
            }

            const comments = await oracle.query<Record<string, unknown>>(
              `
                SELECT *
                FROM "InitiativeComment"
                WHERE "initiativeId" = :id
                ORDER BY "timestamp" DESC
              `,
              { id }
            );

            initiative = {
              ...normalizeInitiativeOracle(base),
              milestones: milestones.map(m => ({
                ...m,
                tasks: tasks
                  .filter(t => String(t.milestoneId) === String(m.id))
                  .map(normalizeMilestoneTaskOracle)
              })),
              comments
            };
          }
        }

        console.log('initiative detail', id, `| dbQueryMs=${Date.now() - queryStart}`);
        if (initiative) {
          const payload = { ...initiative, history: [] };
          setCached(cacheKey, payload);
          return payload;
        }
        return null;
      };
      if (state) {
        if (state.stale && !isRefreshing(cacheKey)) {
          markRefreshing(cacheKey, true);
          singleflight(cacheKey, fetchFresh)
            .catch(err => console.error('SWR refresh failed for', cacheKey, err))
            .finally(() => markRefreshing(cacheKey, false));
        }
        console.log('initiative detail', id, `| cacheHit=true${state.stale ? ' stale' : ''}`);
        return res.json(state.value);
      }
      const fresh = await singleflight(cacheKey, fetchFresh);
      if (!fresh) return res.status(404).json({ error: 'Initiative not found' });
      res.json(fresh);
    } catch (error) {
      console.error('API Error /api/initiatives/:id [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch initiative' });
    }
  };

  const getInitiativeHistory = async (req: any, res: any) => {
    const { id } = req.params;
    const cacheKey = buildCacheKey('initiatives', { history: id });
    try {
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        let history: any[] = [];

        if (prisma) {
          history = await prisma.initiativeHistory.findMany({
            where: { initiativeId: id },
            orderBy: { timestamp: 'desc' }
          });
        } else {
          if (!oracle) {
            throw new Error(`Initiative history is not implemented for DB_PROVIDER=${provider}`);
          }

          history = await oracle.query<Record<string, unknown>>(
            `
              SELECT *
              FROM "InitiativeHistory"
              WHERE "initiativeId" = :id
              ORDER BY "timestamp" DESC
            `,
            { id }
          );
        }

        console.log('initiative history', id, `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, history);
        return history;
      }, `initiative-history ${id}`);
    } catch (error) {
      console.error('API Error /api/initiatives/:id/history [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch initiative history' });
    }
  };

  const getInitiativeComments = async (req: any, res: any) => {
    const { id } = req.params;
    const cacheKey = buildCacheKey('initiatives', { comments: id });
    try {
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        let comments: any[] = [];

        if (prisma) {
          comments = await prisma.initiativeComment.findMany({
            where: { initiativeId: id },
            orderBy: { timestamp: 'desc' }
          });
        } else {
          if (!oracle) {
            throw new Error(`Initiative comments are not implemented for DB_PROVIDER=${provider}`);
          }

          comments = await oracle.query<Record<string, unknown>>(
            `
              SELECT *
              FROM "InitiativeComment"
              WHERE "initiativeId" = :id
              ORDER BY "timestamp" DESC
            `,
            { id }
          );
        }

        console.log('initiative comments', id, `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, comments);
        return comments;
      }, `initiative-comments ${id}`);
    } catch (error) {
      console.error('API Error /api/initiatives/:id/comments [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch initiative comments' });
    }
  };

  const createInitiativeComment = async (req: any, res: any) => {
    const { id } = req.params;
    const { content, userId, userName, timestamp } = req.body || {};

    if (!String(content || '').trim()) {
      return res.status(400).json({ error: 'Validation error', details: 'content is required' });
    }
    if (!String(userId || '').trim()) {
      return res.status(400).json({ error: 'Validation error', details: 'userId is required' });
    }
    if (!String(userName || '').trim()) {
      return res.status(400).json({ error: 'Validation error', details: 'userName is required' });
    }

    try {
      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiative comments write');
        }

        const initiativeRows = await oracle.query<Record<string, unknown>>(
          'SELECT "id" FROM "Initiative" WHERE "id" = :id',
          { id }
        );

        if (initiativeRows.length === 0) {
          return res.status(404).json({ error: 'Initiative not found' });
        }

        const commentId = randomUUID();
        const commentTimestamp = timestamp ? new Date(timestamp) : new Date();

        await oracle.execute(
          `
            INSERT INTO "InitiativeComment" (
              "id", "content", "userId", "userName", "timestamp", "initiativeId"
            ) VALUES (
              :id, :content, :userId, :userName, :timestamp, :initiativeId
            )
          `,
          {
            id: commentId,
            content: String(content).trim(),
            userId: String(userId).trim(),
            userName: String(userName).trim(),
            timestamp: commentTimestamp,
            initiativeId: id
          }
        );

        const createdRows = await oracle.query<Record<string, unknown>>(
          'SELECT * FROM "InitiativeComment" WHERE "id" = :id',
          { id: commentId }
        );

        invalidateCacheByPrefix('initiatives');
        return res.status(201).json(createdRows[0] ?? null);
      }

      const created = await prisma.initiativeComment.create({
        data: {
          content: String(content).trim(),
          userId: String(userId).trim(),
          userName: String(userName).trim(),
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          initiativeId: id
        }
      });

      invalidateCacheByPrefix('initiatives');
      return res.status(201).json(created);
    } catch (error: any) {
      console.error('API Error /api/initiatives/:id/comments [POST]:', error);
      if (error.code === 'P2003') return res.status(404).json({ error: 'Initiative not found' });
      return res.status(500).json({ error: 'Failed to create initiative comment', details: error.message });
    }
  };

  const updateInitiativeComment = async (req: any, res: any) => {
    const { id, commentId } = req.params;
    const { content, timestamp } = req.body || {};

    if (!String(content || '').trim()) {
      return res.status(400).json({ error: 'Validation error', details: 'content is required' });
    }

    try {
      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiative comments write');
        }

        const exists = await oracle.query<Record<string, unknown>>(
          'SELECT "id" FROM "InitiativeComment" WHERE "id" = :commentId AND "initiativeId" = :initiativeId',
          { commentId, initiativeId: id }
        );

        if (exists.length === 0) {
          return res.status(404).json({ error: 'Comment not found' });
        }

        await oracle.execute(
          `
            UPDATE "InitiativeComment"
            SET "content" = :content,
                "timestamp" = :timestamp
            WHERE "id" = :commentId
              AND "initiativeId" = :initiativeId
          `,
          {
            content: String(content).trim(),
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            commentId,
            initiativeId: id
          }
        );

        const updatedRows = await oracle.query<Record<string, unknown>>(
          'SELECT * FROM "InitiativeComment" WHERE "id" = :commentId AND "initiativeId" = :initiativeId',
          { commentId, initiativeId: id }
        );

        invalidateCacheByPrefix('initiatives');
        return res.json(updatedRows[0] ?? null);
      }

      const updated = await prisma.initiativeComment.update({
        where: { id: commentId, initiativeId: id } as any,
        data: {
          content: String(content).trim(),
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }
      });

      invalidateCacheByPrefix('initiatives');
      return res.json(updated);
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Comment not found' });
      console.error('API Error /api/initiatives/:id/comments/:commentId [PATCH]:', error);
      return res.status(500).json({ error: 'Failed to update initiative comment', details: error.message });
    }
  };

  const deleteInitiativeComment = async (req: any, res: any) => {
    const { id, commentId } = req.params;

    try {
      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiative comments write');
        }

        const exists = await oracle.query<Record<string, unknown>>(
          'SELECT "id" FROM "InitiativeComment" WHERE "id" = :commentId AND "initiativeId" = :initiativeId',
          { commentId, initiativeId: id }
        );

        if (exists.length === 0) {
          return res.status(404).json({ error: 'Comment not found' });
        }

        await oracle.execute(
          'DELETE FROM "InitiativeComment" WHERE "id" = :commentId AND "initiativeId" = :initiativeId',
          { commentId, initiativeId: id }
        );

        invalidateCacheByPrefix('initiatives');
        return res.status(204).send();
      }

      const deleted = await prisma.initiativeComment.deleteMany({
        where: { id: commentId, initiativeId: id }
      });
      if (deleted.count === 0) return res.status(404).json({ error: 'Comment not found' });

      invalidateCacheByPrefix('initiatives');
      return res.status(204).send();
    } catch (error: any) {
      console.error('API Error /api/initiatives/:id/comments/:commentId [DELETE]:', error);
      return res.status(500).json({ error: 'Failed to delete initiative comment', details: error.message });
    }
  };

  const createInitiative = async (req: any, res: any) => {
    const { milestones, history, comments, ...rawRest } = req.body;
    const rest = sanitizeInitiativeDto(rawRest);
    try {
      const leaderId = normalizeLeaderId(rest.leaderId);
      if (!leaderId) {
        return res.status(400).json({
          error: 'Validation error',
          details: 'leaderId is required'
        });
      }

      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiatives write');
        }

        const initiativeId = randomUUID();
        const data = rest as Record<string, unknown>;

        await oracle.execute(
          `
            INSERT INTO "Initiative" (
              "id",
              "companyId",
              "departmentId",
              "title",
              "type",
              "benefit",
              "benefitType",
              "scope",
              "customerOwner",
              "originDirectorate",
              "leaderId",
              "technicalLeadId",
              "impactedSystemIds",
              "createdAt",
              "requestDate",
              "businessExpectationDate",
              "status",
              "previousStatus",
              "executingTeamId",
              "executingDirectorate",
              "rationale",
              "externalLinkType",
              "externalLinkName",
              "externalLinkUrl",
              "macroScope",
              "createdById",
              "assignedManagerId",
              "initiativeType",
              "priority",
              "memberIds",
              "startDate",
              "endDate",
              "actualEndDate"
            ) VALUES (
              :id,
              :companyId,
              :departmentId,
              :title,
              :type,
              :benefit,
              :benefitType,
              :scope,
              :customerOwner,
              :originDirectorate,
              :leaderId,
              :technicalLeadId,
              :impactedSystemIds,
              :createdAt,
              :requestDate,
              :businessExpectationDate,
              :status,
              :previousStatus,
              :executingTeamId,
              :executingDirectorate,
              :rationale,
              :externalLinkType,
              :externalLinkName,
              :externalLinkUrl,
              :macroScope,
              :createdById,
              :assignedManagerId,
              :initiativeType,
              :priority,
              :memberIds,
              :startDate,
              :endDate,
              :actualEndDate
            )
          `,
          {
            id: initiativeId,
            companyId: data.companyId,
            departmentId: data.departmentId,
            title: data.title,
            type: data.type,
            benefit: data.benefit,
            benefitType: data.benefitType ?? null,
            scope: data.scope,
            customerOwner: data.customerOwner,
            originDirectorate: data.originDirectorate,
            leaderId,
            technicalLeadId: data.technicalLeadId ?? null,
            impactedSystemIds: asJsonArray(data.impactedSystemIds),
            createdAt: new Date(),
            requestDate: data.requestDate ?? null,
            businessExpectationDate: data.businessExpectationDate ?? null,
            status: data.status,
            previousStatus: data.previousStatus ?? null,
            executingTeamId: data.executingTeamId ?? null,
            executingDirectorate: data.executingDirectorate ?? null,
            rationale: data.rationale ?? null,
            externalLinkType: data.externalLinkType ?? null,
            externalLinkName: data.externalLinkName ?? null,
            externalLinkUrl: data.externalLinkUrl ?? null,
            macroScope: asJsonArray(data.macroScope),
            createdById: data.createdById ?? null,
            assignedManagerId: data.assignedManagerId ?? null,
            initiativeType: data.initiativeType ?? null,
            priority: typeof data.priority === 'number' ? data.priority : 0,
            memberIds: asJsonArray(data.memberIds),
            startDate: data.startDate ?? null,
            endDate: data.endDate ?? null,
            actualEndDate: data.actualEndDate ?? null
          }
        );

        if (Array.isArray(milestones) && milestones.length > 0) {
          for (let milestoneIndex = 0; milestoneIndex < milestones.length; milestoneIndex += 1) {
            const m = milestones[milestoneIndex];
            const milestoneId = m.id || randomUUID();

            await oracle.execute(
              `
                INSERT INTO "InitiativeMilestone" (
                  "id", "name", "systemId", "baselineDate", "realDate", "description",
                  "assignedEngineerId", "startDate", "order", "initiativeId"
                ) VALUES (
                  :id, :name, :systemId, :baselineDate, :realDate, :description,
                  :assignedEngineerId, :startDate, :milestoneOrder, :initiativeId
                )
              `,
              {
                id: milestoneId,
                name: m.name,
                systemId: m.systemId,
                baselineDate: m.baselineDate,
                realDate: m.realDate ?? null,
                description: m.description ?? null,
                assignedEngineerId: m.assignedEngineerId ?? null,
                startDate: m.startDate ?? null,
                milestoneOrder: normalizeMilestoneOrder(m.order, milestoneIndex),
                initiativeId: initiativeId
              }
            );

            if (Array.isArray(m.tasks) && m.tasks.length > 0) {
              for (let taskIndex = 0; taskIndex < m.tasks.length; taskIndex += 1) {
                const t = m.tasks[taskIndex];
                await oracle.execute(
                  `
                    INSERT INTO "MilestoneTask" (
                      "id", "name", "status", "type", "assigneeId", "startDate",
                      "systemId", "systemIds", "priority", "targetDate", "notes",
                      "taskHistory", "order", "milestoneId", "createdAt", "updatedAt"
                    ) VALUES (
                      :id, :name, :status, :taskType, :assigneeId, :startDate,
                      :systemId, :systemIds, :priority, :targetDate, :notes,
                      :taskHistory, :taskOrder, :milestoneId, :createdAt, :updatedAt
                    )
                  `,
                  {
                    id: t.id || randomUUID(),
                    name: t.name,
                    status: t.status ?? 'Backlog',
                    taskType: t.type ?? null,
                    assigneeId: t.assigneeId ?? null,
                    startDate: t.startDate ?? null,
                    systemId: t.systemId ?? null,
                    systemIds: asJsonArray(t.systemIds),
                    priority: typeof t.priority === 'number' ? t.priority : null,
                    targetDate: t.targetDate ?? null,
                    notes: t.notes ?? null,
                    taskHistory: asJsonArray(t.taskHistory),
                    taskOrder: normalizeTaskOrder(t.order, taskIndex),
                    milestoneId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                );
              }
            }
          }
        }

        if (Array.isArray(history) && history.length > 0) {
          for (const h of history) {
            await oracle.execute(
              `
                INSERT INTO "InitiativeHistory" (
                  "id", "timestamp", "user", "action", "fromStatus", "toStatus", "notes", "initiativeId"
                ) VALUES (
                  :id, :timestamp, :historyUser, :historyAction, :fromStatus, :toStatus, :notes, :initiativeId
                )
              `,
              {
                id: randomUUID(),
                timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
                historyUser: h.user ?? 'system',
                historyAction: h.action ?? 'created',
                fromStatus: h.fromStatus ?? null,
                toStatus: h.toStatus ?? null,
                notes: h.notes ?? null,
                initiativeId
              }
            );
          }
        }

        if (Array.isArray(comments) && comments.length > 0) {
          for (const c of comments) {
            await oracle.execute(
              `
                INSERT INTO "InitiativeComment" (
                  "id", "content", "userId", "userName", "timestamp", "initiativeId"
                ) VALUES (
                  :id, :content, :userId, :userName, :timestamp, :initiativeId
                )
              `,
              {
                id: randomUUID(),
                content: c.content,
                userId: c.userId,
                userName: c.userName,
                timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
                initiativeId
              }
            );
          }
        }

        const initiative = await fetchInitiativeDetailOracle(initiativeId);
        invalidateCacheByPrefix('initiatives');
        return res.json(initiative);
      }

      const initiative = await prisma.initiative.create({
        data: {
          ...rest,
          leaderId,
          milestones: {
            create: milestones?.map((m: any, milestoneIndex: number) => ({
              name: m.name,
              systemId: m.systemId,
              baselineDate: m.baselineDate,
              realDate: m.realDate,
              description: m.description,
              assignedEngineerId: m.assignedEngineerId,
              startDate: m.startDate,
              order: normalizeMilestoneOrder(m.order, milestoneIndex),
              tasks: {
                create: m.tasks?.map((t: any, taskIndex: number) => ({
                  name: t.name,
                  status: t.status,
                  type: t.type,
                  assigneeId: t.assigneeId,
                  startDate: t.startDate,
                  systemId: t.systemId,
                  targetDate: t.targetDate,
                  notes: t.notes,
                  order: normalizeTaskOrder(t.order, taskIndex)
                }))
              }
            }))
          },
          history: {
            create: history?.map((h: any) => ({
              timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
              user: h.user,
              action: h.action,
              fromStatus: h.fromStatus,
              toStatus: h.toStatus,
              notes: h.notes
            }))
          },
          comments: {
            create: comments?.map((c: any) => ({
              content: c.content,
              userId: c.userId,
              userName: c.userName,
              timestamp: c.timestamp ? new Date(c.timestamp) : new Date()
            }))
          }
        } as any,
        include: {
          milestones: { include: { tasks: true } },
          history: true,
          comments: true
        }
      });
      invalidateCacheByPrefix('initiatives');
      res.json(initiative);
    } catch (error: any) {
      console.error('API Error /api/initiatives [POST]:', error);
      res.status(500).json({ error: 'Failed to create initiative', details: error.message });
    }
  };

  const updateInitiative = async (req: any, res: any) => {
    const { id } = req.params;
    const { milestones, history, removedMilestoneIds, ...rawRest } = req.body;
    const rest = sanitizeInitiativeDto(rawRest);

    try {
      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiatives write');
        }

        const currentRows = await oracle.query<Record<string, unknown>>(
          'SELECT "id", "leaderId" FROM "Initiative" WHERE "id" = :id',
          { id }
        );

        const current = currentRows[0];
        if (!current) {
          return res.status(404).json({ error: 'Initiative not found' });
        }

        const data = rest as Record<string, unknown>;
        const hasLeaderInPayload = Object.prototype.hasOwnProperty.call(data, 'leaderId');
        const nextLeaderId = hasLeaderInPayload
          ? normalizeLeaderId(data.leaderId)
          : normalizeLeaderId(current.leaderId);

        if (!nextLeaderId) {
          return res.status(400).json({
            error: 'Validation error',
            details: 'leaderId is required'
          });
        }

        const fields: string[] = [];
        const binds: Record<string, unknown> = { id };
        const assign = (field: string, key: string, value: unknown) => {
          if (value !== undefined) {
            fields.push(`"${field}" = :${key}`);
            binds[key] = value;
          }
        };

        assign('companyId', 'companyId', data.companyId);
        assign('departmentId', 'departmentId', data.departmentId);
        assign('title', 'title', data.title);
        assign('type', 'type', data.type);
        assign('benefit', 'benefit', data.benefit);
        assign('benefitType', 'benefitType', data.benefitType);
        assign('scope', 'scope', data.scope);
        assign('customerOwner', 'customerOwner', data.customerOwner);
        assign('originDirectorate', 'originDirectorate', data.originDirectorate);
        assign('technicalLeadId', 'technicalLeadId', data.technicalLeadId);
        assign('requestDate', 'requestDate', data.requestDate);
        assign('businessExpectationDate', 'businessExpectationDate', data.businessExpectationDate);
        assign('status', 'status', data.status);
        assign('previousStatus', 'previousStatus', data.previousStatus);
        assign('executingTeamId', 'executingTeamId', data.executingTeamId);
        assign('executingDirectorate', 'executingDirectorate', data.executingDirectorate);
        assign('rationale', 'rationale', data.rationale);
        assign('externalLinkType', 'externalLinkType', data.externalLinkType);
        assign('externalLinkName', 'externalLinkName', data.externalLinkName);
        assign('externalLinkUrl', 'externalLinkUrl', data.externalLinkUrl);
        assign('createdById', 'createdById', data.createdById);
        assign('assignedManagerId', 'assignedManagerId', data.assignedManagerId);
        assign('initiativeType', 'initiativeType', data.initiativeType);
        assign('priority', 'priority', data.priority);
        assign('startDate', 'startDate', data.startDate);
        assign('endDate', 'endDate', data.endDate);
        assign('actualEndDate', 'actualEndDate', data.actualEndDate);
        if (hasLeaderInPayload) assign('leaderId', 'leaderId', nextLeaderId);
        if (data.impactedSystemIds !== undefined) {
          assign('impactedSystemIds', 'impactedSystemIds', asJsonArray(data.impactedSystemIds));
        }
        if (data.macroScope !== undefined) {
          assign('macroScope', 'macroScope', asJsonArray(data.macroScope));
        }
        if (data.memberIds !== undefined) {
          assign('memberIds', 'memberIds', asJsonArray(data.memberIds));
        }

        if (fields.length > 0) {
          await oracle.execute(
            `
              UPDATE "Initiative"
              SET ${fields.join(', ')}
              WHERE "id" = :id
            `,
            binds
          );
        }

        if (Array.isArray(removedMilestoneIds) && removedMilestoneIds.length > 0) {
          const milestoneBinds = Object.fromEntries(removedMilestoneIds.map((value: string, idx: number) => [`m${idx}`, value]));
          await oracle.execute(
            `
              DELETE FROM "MilestoneTask"
              WHERE "milestoneId" IN (${removedMilestoneIds.map((_: string, idx: number) => `:m${idx}`).join(', ')})
            `,
            milestoneBinds
          );
          await oracle.execute(
            `
              DELETE FROM "InitiativeMilestone"
              WHERE "initiativeId" = :initiativeId
                AND "id" IN (${removedMilestoneIds.map((_: string, idx: number) => `:m${idx}`).join(', ')})
            `,
            {
              initiativeId: id,
              ...milestoneBinds
            }
          );
        }

        if (Array.isArray(milestones) && milestones.length > 0) {
          for (let milestoneIndex = 0; milestoneIndex < milestones.length; milestoneIndex += 1) {
            const m = milestones[milestoneIndex];
            const milestoneId = m.id || randomUUID();

            const existingMilestone = await oracle.query<Record<string, unknown>>(
              'SELECT "id" FROM "InitiativeMilestone" WHERE "id" = :id AND "initiativeId" = :initiativeId',
              { id: milestoneId, initiativeId: id }
            );

            if (existingMilestone.length > 0) {
              await oracle.execute(
                `
                  UPDATE "InitiativeMilestone"
                  SET "name" = :b1,
                      "systemId" = :b2,
                      "baselineDate" = :b3,
                      "realDate" = :b4,
                      "description" = :b5,
                      "assignedEngineerId" = :b6,
                      "startDate" = :b7,
                      "order" = :b8
                  WHERE "id" = :b9
                    AND "initiativeId" = :b10
                `,
                {
                  b1: m.name,
                  b2: m.systemId,
                  b3: m.baselineDate,
                  b4: m.realDate ?? null,
                  b5: m.description ?? null,
                  b6: m.assignedEngineerId ?? null,
                  b7: m.startDate ?? null,
                  b8: normalizeMilestoneOrder(m.order, milestoneIndex),
                  b9: milestoneId,
                  b10: id
                }
              );
            } else {
              await oracle.execute(
                `
                  INSERT INTO "InitiativeMilestone" (
                    "id", "name", "systemId", "baselineDate", "realDate", "description",
                    "assignedEngineerId", "startDate", "order", "initiativeId"
                  ) VALUES (
                    :id, :name, :systemId, :baselineDate, :realDate, :description,
                    :assignedEngineerId, :startDate, :milestoneOrder, :initiativeId
                  )
                `,
                {
                  id: milestoneId,
                  name: m.name,
                  systemId: m.systemId,
                  baselineDate: m.baselineDate,
                  realDate: m.realDate ?? null,
                  description: m.description ?? null,
                  assignedEngineerId: m.assignedEngineerId ?? null,
                  startDate: m.startDate ?? null,
                  milestoneOrder: normalizeMilestoneOrder(m.order, milestoneIndex),
                  initiativeId: id
                }
              );
            }

            if (Array.isArray(m.tasks)) {
              const persistedTaskIds = m.tasks.map((t: any) => t.id).filter(Boolean);
              if (persistedTaskIds.length > 0) {
                const taskBinds = Object.fromEntries(persistedTaskIds.map((value: string, idx: number) => [`t${idx}`, value]));
                await oracle.execute(
                  `
                    DELETE FROM "MilestoneTask"
                    WHERE "milestoneId" = :milestoneId
                      AND "id" NOT IN (${persistedTaskIds.map((_: string, idx: number) => `:t${idx}`).join(', ')})
                  `,
                  {
                    milestoneId,
                    ...taskBinds
                  }
                );
              } else {
                await oracle.execute('DELETE FROM "MilestoneTask" WHERE "milestoneId" = :milestoneId', { milestoneId });
              }

              for (let taskIndex = 0; taskIndex < m.tasks.length; taskIndex += 1) {
                const t = m.tasks[taskIndex];
                const taskId = t.id || randomUUID();

                const existingTask = await oracle.query<Record<string, unknown>>(
                  'SELECT "id" FROM "MilestoneTask" WHERE "id" = :id',
                  { id: taskId }
                );

                const taskPayload = {
                  id: taskId,
                  name: t.name,
                  status: t.status ?? 'Backlog',
                  taskType: t.type ?? null,
                  assigneeId: t.assigneeId ?? null,
                  startDate: t.startDate ?? null,
                  systemId: t.systemId ?? null,
                  systemIds: asJsonArray(t.systemIds),
                  priority: typeof t.priority === 'number' ? t.priority : null,
                  targetDate: t.targetDate ?? null,
                  notes: t.notes ?? null,
                  taskHistory: asJsonArray(Array.isArray(t.taskHistory)
                    ? t.taskHistory.map((h: any) => {
                        const { userPhoto, ...restTaskHistory } = h;
                        return restTaskHistory;
                      })
                    : []),
                  taskOrder: normalizeTaskOrder(t.order, taskIndex),
                  milestoneId,
                  updatedAt: new Date()
                };

                if (existingTask.length > 0) {
                  await oracle.execute(
                    `
                      UPDATE "MilestoneTask"
                      SET "name" = :name,
                          "status" = :status,
                          "type" = :taskType,
                          "assigneeId" = :assigneeId,
                          "startDate" = :startDate,
                          "systemId" = :systemId,
                          "systemIds" = :systemIds,
                          "priority" = :priority,
                          "targetDate" = :targetDate,
                          "notes" = :notes,
                          "taskHistory" = :taskHistory,
                          "order" = :taskOrder,
                          "milestoneId" = :milestoneId,
                          "updatedAt" = :updatedAt
                      WHERE "id" = :id
                    `,
                    taskPayload
                  );
                } else {
                  await oracle.execute(
                    `
                      INSERT INTO "MilestoneTask" (
                        "id", "name", "status", "type", "assigneeId", "startDate",
                        "systemId", "systemIds", "priority", "targetDate", "notes",
                        "taskHistory", "order", "milestoneId", "createdAt", "updatedAt"
                      ) VALUES (
                        :id, :name, :status, :taskType, :assigneeId, :startDate,
                        :systemId, :systemIds, :priority, :targetDate, :notes,
                        :taskHistory, :taskOrder, :milestoneId, :createdAt, :updatedAt
                      )
                    `,
                    {
                      ...taskPayload,
                      createdAt: new Date()
                    }
                  );
                }
              }
            }
          }
        }

        if (Array.isArray(history) && history.length > 0) {
          for (const h of history) {
            await oracle.execute(
              `
                INSERT INTO "InitiativeHistory" (
                  "id", "timestamp", "user", "action", "fromStatus", "toStatus", "notes", "initiativeId"
                ) VALUES (
                  :id, :timestamp, :historyUser, :historyAction, :fromStatus, :toStatus, :notes, :initiativeId
                )
              `,
              {
                id: randomUUID(),
                timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
                historyUser: h.user ?? 'system',
                historyAction: h.action ?? 'updated',
                fromStatus: h.fromStatus ?? null,
                toStatus: h.toStatus ?? null,
                notes: h.notes ?? null,
                initiativeId: id
              }
            );
          }
        }

        const updated = await fetchInitiativeDetailOracle(id);
        invalidateCacheByPrefix('initiatives');
        return res.json(updated);
      }

      const current = await prisma.initiative.findUnique({
        where: { id },
        select: { id: true, leaderId: true }
      });

      if (!current) {
        return res.status(404).json({ error: 'Initiative not found' });
      }

      const hasLeaderInPayload = Object.prototype.hasOwnProperty.call(rest, 'leaderId');
      const nextLeaderId = hasLeaderInPayload
        ? normalizeLeaderId(rest.leaderId)
        : normalizeLeaderId(current.leaderId);

      if (!nextLeaderId) {
        return res.status(400).json({
          error: 'Validation error',
          details: 'leaderId is required'
        });
      }

      if (hasLeaderInPayload) {
        rest.leaderId = nextLeaderId;
      }

      await prisma.initiative.update({
        where: { id },
        data: rest
      });

      if (Array.isArray(removedMilestoneIds) && removedMilestoneIds.length > 0) {
        await prisma.initiativeMilestone.deleteMany({
          where: {
            initiativeId: id,
            id: { in: removedMilestoneIds }
          }
        });
      }

      if (Array.isArray(milestones) && milestones.length > 0) {
        await Promise.all(milestones.map(async (m: any) => {
          let milestone;
          const milestoneData = {
            name: m.name,
            systemId: m.systemId,
            baselineDate: m.baselineDate,
            realDate: m.realDate,
            description: m.description,
            assignedEngineerId: m.assignedEngineerId,
            startDate: m.startDate,
            order: normalizeMilestoneOrder(m.order, 0),
            initiativeId: id
          };

          if (m.id) {
            milestone = await prisma.initiativeMilestone.upsert({
              where: { id: m.id },
              update: milestoneData,
              create: {
                id: m.id,
                ...milestoneData
              }
            });
          } else {
            milestone = await prisma.initiativeMilestone.create({
              data: milestoneData
            });
          }

          if (Array.isArray(m.tasks)) {
            const persistedTaskIds = m.tasks.map((t: any) => t.id).filter(Boolean);

            await prisma.milestoneTask.deleteMany({
              where: {
                milestoneId: milestone.id,
                ...(persistedTaskIds.length > 0 ? { id: { notIn: persistedTaskIds } } : {})
              }
            });

            await Promise.all(m.tasks.map(async (t: any, taskIndex: number) => {
              const safeOrder = normalizeTaskOrder(t.order, taskIndex);
              const taskData = {
                name: t.name,
                status: t.status,
                type: t.type,
                assigneeId: t.assigneeId,
                startDate: t.startDate,
                systemId: t.systemId,
                systemIds: Array.isArray(t.systemIds) ? t.systemIds : [],
                priority: typeof t.priority === 'number' ? t.priority : null,
                targetDate: t.targetDate,
                notes: t.notes,
                taskHistory: Array.isArray(t.taskHistory) ? t.taskHistory.map((h: any) => { const { userPhoto, ...rest } = h; return rest; }) : [],
                order: safeOrder,
                milestoneId: milestone.id
              };

              if (t.id) {
                await prisma.milestoneTask.upsert({
                  where: { id: t.id },
                  update: taskData,
                  create: {
                    id: t.id,
                    ...taskData
                  }
                });
              } else {
                await prisma.milestoneTask.create({
                  data: taskData
                });
              }
            }));
          }
        }));
      }

      if (Array.isArray(history) && history.length > 0) {
        await prisma.initiativeHistory.createMany({
          data: history.map((h: any) => ({
            timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
            user: h.user,
            action: h.action,
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            notes: h.notes,
            initiativeId: id
          }))
        });
      }

      const updated = await prisma.initiative.findUnique({
        where: { id },
        include: {
          milestones: {
            orderBy: { order: 'asc' },
            include: { tasks: { orderBy: { order: 'asc' } } }
          },
          history: true,
          comments: true
        }
      });

      invalidateCacheByPrefix('initiatives');
      res.json(updated);
    } catch (error: any) {
      console.error('API Error /api/initiatives/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update initiative', details: error.message });
    }
  };

  const deleteInitiative = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiatives write');
        }

        await oracle.execute(
          `
            DELETE FROM "MilestoneTask"
            WHERE "milestoneId" IN (
              SELECT "id" FROM "InitiativeMilestone" WHERE "initiativeId" = :initiativeId
            )
          `,
          { initiativeId: id }
        );
        await oracle.execute('DELETE FROM "InitiativeMilestone" WHERE "initiativeId" = :initiativeId', {
          initiativeId: id
        });
        await oracle.execute('DELETE FROM "InitiativeHistory" WHERE "initiativeId" = :initiativeId', {
          initiativeId: id
        });
        await oracle.execute('DELETE FROM "InitiativeComment" WHERE "initiativeId" = :initiativeId', {
          initiativeId: id
        });
        await oracle.execute('DELETE FROM "Allocation" WHERE "initiativeId" = :initiativeId', {
          initiativeId: id
        });
        await oracle.execute('DELETE FROM "Initiative" WHERE "id" = :id', { id });

        invalidateCacheByPrefix('initiatives');
        return res.json({ message: 'Initiative deleted' });
      }

      await prisma.initiativeMilestone.deleteMany({ where: { initiativeId: id } });
      await prisma.initiativeHistory.deleteMany({ where: { initiativeId: id } });
      await prisma.allocation.deleteMany({ where: { initiativeId: id } });
      await prisma.initiative.delete({ where: { id } });
      invalidateCacheByPrefix('initiatives');
      res.json({ message: 'Initiative deleted' });
    } catch (error) {
      console.error('API Error /api/initiatives/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete initiative' });
    }
  };

  const createMilestone = async (req: any, res: any) => {
    const { id } = req.params;
    const {
      name,
      systemId,
      baselineDate,
      realDate,
      description,
      assignedEngineerId,
      startDate,
      order
    } = req.body || {};

    if (!String(name || '').trim()) {
      return res.status(400).json({ error: 'Validation error', details: 'name is required' });
    }

    try {
      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiative milestones write');
        }

        const initiativeRows = await oracle.query<Record<string, unknown>>(
          'SELECT "id" FROM "Initiative" WHERE "id" = :id',
          { id }
        );

        if (initiativeRows.length === 0) {
          return res.status(404).json({ error: 'Initiative not found' });
        }

        const milestoneId = randomUUID();
        await oracle.execute(
          `
            INSERT INTO "InitiativeMilestone" (
              "id", "name", "systemId", "baselineDate", "realDate", "description",
              "assignedEngineerId", "startDate", "order", "initiativeId"
            ) VALUES (
              :id, :name, :systemId, :baselineDate, :realDate, :description,
              :assignedEngineerId, :startDate, :milestoneOrder, :initiativeId
            )
          `,
          {
            id: milestoneId,
            name: String(name).trim(),
            systemId: systemId ?? null,
            baselineDate: baselineDate ?? null,
            realDate: realDate ?? null,
            description: description ?? null,
            assignedEngineerId: assignedEngineerId ?? null,
            startDate: startDate ?? null,
            milestoneOrder: normalizeMilestoneOrder(order, 0),
            initiativeId: id
          }
        );

        const createdRows = await oracle.query<Record<string, unknown>>(
          'SELECT * FROM "InitiativeMilestone" WHERE "id" = :id',
          { id: milestoneId }
        );

        invalidateCacheByPrefix('initiatives');
        return res.status(201).json(createdRows[0] ?? null);
      }

      const created = await prisma.initiativeMilestone.create({
        data: {
          name: String(name).trim(),
          systemId: systemId ?? null,
          baselineDate: baselineDate ?? null,
          realDate: realDate ?? null,
          description: description ?? null,
          assignedEngineerId: assignedEngineerId ?? null,
          startDate: startDate ?? null,
          order: normalizeMilestoneOrder(order, 0),
          initiativeId: id
        }
      });

      invalidateCacheByPrefix('initiatives');
      return res.status(201).json(created);
    } catch (error: any) {
      if (error.code === 'P2003') return res.status(404).json({ error: 'Initiative not found' });
      console.error('API Error /api/initiatives/:id/milestones [POST]:', error);
      return res.status(500).json({ error: 'Failed to create milestone', details: error.message });
    }
  };

  const deleteMilestone = async (req: any, res: any) => {
    const { id, milestoneId } = req.params;

    try {
      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiative milestones write');
        }

        const exists = await oracle.query<Record<string, unknown>>(
          'SELECT "id" FROM "InitiativeMilestone" WHERE "id" = :id AND "initiativeId" = :initiativeId',
          { id: milestoneId, initiativeId: id }
        );

        if (exists.length === 0) {
          return res.status(404).json({ error: 'Milestone not found' });
        }

        await oracle.execute('DELETE FROM "MilestoneTask" WHERE "milestoneId" = :milestoneId', { milestoneId });
        await oracle.execute(
          'DELETE FROM "InitiativeMilestone" WHERE "id" = :id AND "initiativeId" = :initiativeId',
          { id: milestoneId, initiativeId: id }
        );

        invalidateCacheByPrefix('initiatives');
        return res.status(204).send();
      }

      const deleted = await prisma.initiativeMilestone.deleteMany({
        where: { id: milestoneId, initiativeId: id }
      });
      if (deleted.count === 0) return res.status(404).json({ error: 'Milestone not found' });

      invalidateCacheByPrefix('initiatives');
      return res.status(204).send();
    } catch (error: any) {
      console.error('API Error /api/initiatives/:id/milestones/:milestoneId [DELETE]:', error);
      return res.status(500).json({ error: 'Failed to delete milestone', details: error.message });
    }
  };

  const updateMilestone = async (req: any, res: any) => {
    const { id, milestoneId } = req.params;
    const { name, systemId, baselineDate, realDate, description, assignedEngineerId, startDate, order } = req.body || {};

    try {
      const data: Record<string, any> = {};
      if (name !== undefined) data.name = String(name).trim();
      if (systemId !== undefined) data.systemId = systemId;
      if (baselineDate !== undefined) data.baselineDate = baselineDate;
      if (realDate !== undefined) data.realDate = realDate;
      if (description !== undefined) data.description = description;
      if (assignedEngineerId !== undefined) data.assignedEngineerId = assignedEngineerId;
      if (startDate !== undefined) data.startDate = startDate;
      if (order !== undefined) data.order = normalizeMilestoneOrder(order, 0);

      if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No fields to update' });

      if (!prisma) {
        if (!oracle) {
          return writeNotSupported(res, 'Initiative milestones write');
        }

        const exists = await oracle.query<Record<string, unknown>>(
          'SELECT "id" FROM "InitiativeMilestone" WHERE "id" = :id AND "initiativeId" = :initiativeId',
          { id: milestoneId, initiativeId: id }
        );

        if (exists.length === 0) {
          return res.status(404).json({ error: 'Milestone not found' });
        }

        const fields: string[] = [];
        const binds: Record<string, unknown> = { milestoneId, initiativeId: id };
        const assign = (field: string, key: string, value: unknown) => {
          if (value !== undefined) {
            fields.push(`"${field}" = :${key}`);
            binds[key] = value;
          }
        };

        assign('name', 'name', data.name);
        assign('systemId', 'systemId', data.systemId);
        assign('baselineDate', 'baselineDate', data.baselineDate);
        assign('realDate', 'realDate', data.realDate);
        assign('description', 'description', data.description);
        assign('assignedEngineerId', 'assignedEngineerId', data.assignedEngineerId);
        assign('startDate', 'startDate', data.startDate);
        assign('order', 'order', data.order);

        if (fields.length > 0) {
          await oracle.execute(
            `
              UPDATE "InitiativeMilestone"
              SET ${fields.join(', ')}
              WHERE "id" = :milestoneId
                AND "initiativeId" = :initiativeId
            `,
            binds
          );
        }

        invalidateCacheByPrefix('initiatives');
        return res.status(204).send();
      }

      const updated = await prisma.initiativeMilestone.updateMany({
        where: { id: milestoneId, initiativeId: id },
        data
      });
      if (updated.count === 0) return res.status(404).json({ error: 'Milestone not found' });

      invalidateCacheByPrefix('initiatives');
      return res.status(204).send();
    } catch (error: any) {
      console.error('API Error /api/initiatives/:id/milestones/:milestoneId [PATCH]:', error);
      return res.status(500).json({ error: 'Failed to update milestone', details: error.message });
    }
  };

  return {
    getInitiatives,
    getInitiativeById,
    getInitiativeHistory,
    getInitiativeComments,
    createInitiativeComment,
    updateInitiativeComment,
    deleteInitiativeComment,
    createMilestone,
    deleteMilestone,
    createInitiative,
    updateInitiative,
    updateMilestone,
    deleteInitiative
  };
}
