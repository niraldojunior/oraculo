import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import { sanitizeInitiativeDto } from '../dto/initiativeDto.js';

interface InitiativesControllerDeps {
  prisma: PrismaClient;
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

  const getInitiatives = async (req: any, res: any) => {
    try {
      const lite = String(req.query.lite || 'false').toLowerCase() === 'true';
      const where = getCommonWhere(req);
      const cacheKey = buildCacheKey('initiatives', { ...where, lite });

      const fetchFresh = async () => {
        const queryStart = Date.now();
        if (lite) {
          const initiatives = await prisma.initiative.findMany({
            where,
            orderBy: { createdAt: 'desc' }
          });
          const queryMs = Date.now() - queryStart;
          console.log('Found', initiatives.length, 'initiatives', `| dbQueryMs=${queryMs}`, '| lite=true');
          setCached(cacheKey, initiatives);
          return initiatives;
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
        const initiative = await prisma.initiative.findUnique({
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
        const history = await prisma.initiativeHistory.findMany({
          where: { initiativeId: id },
          orderBy: { timestamp: 'desc' }
        });
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
        const comments = await prisma.initiativeComment.findMany({
          where: { initiativeId: id },
          orderBy: { timestamp: 'desc' }
        });
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
