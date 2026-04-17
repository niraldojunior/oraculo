// ================== APP.TS STARTING ==================

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

process.stderr.write('\n=== APP.TS CODE IS EXECUTING ===\n');

console.log('[app.ts] Module loading...');

// Carregar .env.local primeiro, depois .env, depois usar values padrão
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

console.log('[app.ts] Creating Prisma client...');
const prisma = new PrismaClient();
console.log('[app.ts] Prisma client created');
const app = express();

function normalizeTaskOrder(order: unknown, fallback = 0) {
  return Number.isInteger(order) ? Number(order) : fallback;
}

function normalizeMilestoneOrder(order: unknown, fallback = 0) {
  return Number.isInteger(order) ? Number(order) : fallback;
}

async function repairNullMilestoneTaskOrders() {
  try {
    const repaired = await prisma.$executeRawUnsafe('UPDATE "MilestoneTask" SET "order" = 0 WHERE "order" IS NULL');
    if (repaired > 0) {
      console.log(`[app.ts] Repaired ${repaired} milestone task records with null order`);
    }
  } catch (error) {
    console.warn('[app.ts] Milestone task order repair skipped:', error);
  }
}

async function repairNullInitiativeMilestoneOrders() {
  try {
    const repaired = await prisma.$executeRawUnsafe('UPDATE "InitiativeMilestone" SET "order" = 0 WHERE "order" IS NULL');
    if (repaired > 0) {
      console.log(`[app.ts] Repaired ${repaired} initiative milestone records with null order`);
    }
  } catch (error) {
    console.warn('[app.ts] Initiative milestone order repair skipped:', error);
  }
}

// Test database connection on startup
(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');
    await repairNullInitiativeMilestoneOrders();
    await repairNullMilestoneTaskOrders();
  } catch (error) {
    console.error('✗ Database connection failed:', error);
  }
})();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Auth Endpoints
app.post('/api/auth/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  // Normalize email
  email = email.trim().toLowerCase();

  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        isAdmin: true,
        companyId: true,
        departmentId: true,
        role: true,
        associatedCompanyIds: true
      }
    });

    if (collaborator && (collaborator as any).password === password) {
      return res.json({
        user: collaborator,
        isAdmin: (collaborator as any).isAdmin || false,
        type: 'collaborator'
      });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Login error detail:', error);
    res.status(500).json({ error: 'Erro interno no servidor (Banco de dados)' });
  }
});


app.get('/api/collaborators/email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        departmentId: true,
        photoUrl: true,
        phone: true,
        bio: true,
        linkedinUrl: true,
        githubUrl: true,
        isAdmin: true,
        skills: true,
        squadId: true,
        associatedCompanyIds: true
      }
    });
    if (!collaborator) return res.status(404).json({ error: 'Collaborator not found' });
    res.json(collaborator);
  } catch (error) {
    console.error('API Error /api/collaborators/email/:email [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch collaborator data (Database error)' });
  }
});

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/systems', async (req, res) => {
  try {
    const systems = await prisma.system.findMany({
      where: getCommonWhere(req)
    });
    res.json(systems);
  } catch (error) {
    console.error('API Error /api/systems [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch systems' });
  }
});

app.get('/api/inventory-context', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    const [systems, teams, collaborators, vendors, departments] = await Promise.all([
      prisma.system.findMany({ where }),
      prisma.team.findMany({ where }),
      prisma.collaborator.findMany({ where, select: collaboratorSafeSelect }),
      prisma.vendor.findMany({ where }),
      prisma.department.findMany()
    ]);
    res.json({ systems, teams, collaborators, vendors, departments });
  } catch (error) {
    console.error('API Error /api/inventory-context [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch inventory context' });
  }
});

app.get('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const system = await prisma.system.findUnique({
      where: { id }
    });
    if (!system) return res.status(404).json({ error: 'System not found' });
    res.json(system);
  } catch (error) {
    console.error('API Error /api/systems/:id [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch system' });
  }
});

const VALID_SYSTEM_FIELDS = new Set([
  'id', 'name', 'platformName', 'domain', 'subDomain', 'criticality',
  'techStack', 'ownerTeamId', 'smeId', 'lifecycleStatus', 'debtScore',
  'description', 'platformCategory', 'vendorId', 'repoUrl', 'environments', 'contextFiles',
  'companyId', 'departmentId'
]);

function sanitizeSystem(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_SYSTEM_FIELDS.has(key)) clean[key] = data[key];
  }
  // Sanitize optional relation IDs
  if (clean.ownerTeamId === '') clean.ownerTeamId = null;
  if (clean.smeId === '') clean.smeId = null;
  if (clean.vendorId === '') clean.vendorId = null;
  return clean;
}

const VALID_COLLABORATOR_FIELDS = new Set([
  'name', 'email', 'role', 'squadId', 'photoUrl', 'phone', 'bio', 'linkedinUrl', 'githubUrl',
  'companyId', 'departmentId', 'password', 'isAdmin', 'birthday', 'vacationStart', 'associatedCompanyIds',
  'startDate', 'endDate', 'uf'
]);

function sanitizeCollaborator(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_COLLABORATOR_FIELDS.has(key)) clean[key] = data[key];
  }
  if (clean.squadId === '') clean.squadId = null;
  if (clean.departmentId === '') clean.departmentId = null;
  if (clean.companyId === '') clean.companyId = null;
  if (clean.vacationStart === '') clean.vacationStart = null;
  if (clean.startDate === '') clean.startDate = null;
  if (clean.endDate === '') clean.endDate = null;
  if (clean.birthday === '') clean.birthday = null;

  // Role mappings and normalizations
  if (clean.role === 'VP') clean.role = 'Head';
  if (clean.role === 'Engineer/Analyst' || clean.role === 'ENGINEER/ANALYST') clean.role = 'Engineer';

  return clean;
}

const VALID_TEAM_FIELDS = new Set([
  'name', 'type', 'parentTeamId', 'leaderId', 'companyId', 'departmentId', 'receivesInitiatives'
]);

function sanitizeTeam(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_TEAM_FIELDS.has(key)) clean[key] = data[key];
  }
  if (clean.parentTeamId === '') clean.parentTeamId = null;
  if (clean.leaderId === '') clean.leaderId = null;
  return clean;
}



// Helper to ensure companyId matches department's companyId
async function ensureCompanyMatchesDept(data: any) {
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { companyId: true }
    });
    if (dept) {
      data.companyId = dept.companyId;
    }
  }
  return data;
}

// Helper for context filtering
function getCommonWhere(req: express.Request) {
  const { companyId, departmentId } = req.query;
  const where: any = {};
  if (companyId) where.companyId = companyId as string;
  if (departmentId) where.departmentId = departmentId as string;
  return where;
}

const collaboratorSafeSelect = {
  id: true,
  companyId: true,
  departmentId: true,
  name: true,
  email: true,
  role: true,
  squadId: true,
  photoUrl: true,
  phone: true,
  bio: true,
  linkedinUrl: true,
  githubUrl: true,
  isAdmin: true,
  associatedCompanyIds: true,
  vacationStart: true,
  startDate: true,
  endDate: true
} as const;

const VALID_INITIATIVE_SCALAR_FIELDS = new Set([
  'title', 'type', 'benefit', 'benefitType', 'scope', 'customerOwner',
  'originDirectorate', 'leaderId', 'technicalLeadId', 'impactedSystemIds',
  'requestDate', 'businessExpectationDate', 'status', 'previousStatus', 'companyId', 'departmentId', 'executingDirectorate', 'executingTeamId', 'rationale', 'externalLinkType', 'externalLinkName', 'externalLinkUrl', 'macroScope', 'createdById', 'assignedManagerId', 'initiativeType', 'priority', 'memberIds', 'startDate', 'endDate', 'actualEndDate'
]);


function sanitizeInitiative(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_INITIATIVE_SCALAR_FIELDS.has(key)) {
      clean[key] = data[key];
    }
  }
  if (clean.benefitType === '') clean.benefitType = null;
  if (clean.technicalLeadId === '') clean.technicalLeadId = null;
  if (clean.businessExpectationDate === '') clean.businessExpectationDate = null;
  if (clean.previousStatus === '') clean.previousStatus = null;
  return clean;
}

app.post('/api/systems', async (req, res) => {
  try {
    const data = sanitizeSystem(req.body);
    delete data.id;
    await ensureCompanyMatchesDept(data);

    const system = await prisma.system.create({ data: data as any });
    res.json(system);
  } catch (error: any) {
    console.error('API Error /api/systems [POST]:', error);
    res.status(500).json({ error: 'Failed to create system', details: error.message });
  }
});

app.patch('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeSystem(req.body);
    delete data.id;
    await ensureCompanyMatchesDept(data);

    const system = await prisma.system.update({
      where: { id },
      data: data as any
    });
    res.json(system);
  } catch (error: any) {
    console.error('API Error /api/systems/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update system', details: error.message });
  }
});

app.delete('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.system.delete({
      where: { id }
    });
    res.json({ message: 'System deleted' });
  } catch (error: any) {
    console.error('API Error /api/systems/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete system', details: error.message });
  }
});

app.get('/api/initiatives', async (req, res) => {
  try {
    await repairNullInitiativeMilestoneOrders();
    await repairNullMilestoneTaskOrders();

    const initiatives = await prisma.initiative.findMany({
      where: getCommonWhere(req),
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' }
            }
          }
        },
        history: true,
        comments: true
      }
    });
    res.json(initiatives);
  } catch (error) {
    console.error('API Error /api/initiatives [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch initiatives' });
  }
});

app.get('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await repairNullInitiativeMilestoneOrders();
    await repairNullMilestoneTaskOrders();

    const initiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' }
            }
          }
        },
        history: true,
        comments: true
      }
    });
    if (!initiative) return res.status(404).json({ error: 'Initiative not found' });
    res.json(initiative);
  } catch (error) {
    console.error('API Error /api/initiatives/:id [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch initiative' });
  }
});

app.post('/api/initiatives', async (req, res) => {
  const { milestones, history, comments, ...rawRest } = req.body;
  const rest = sanitizeInitiative(rawRest);
  try {
    const initiative = await prisma.initiative.create({
      data: {
        ...rest,
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
            userPhoto: c.userPhoto,
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
    res.json(initiative);
  } catch (error: any) {
    console.error('API Error /api/initiatives [POST]:', error);
    res.status(500).json({ error: 'Failed to create initiative', details: error.message });
  }
});


app.patch('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  const { milestones, history, comments, removedMilestoneIds, ...rawRest } = req.body;
  const rest = sanitizeInitiative(rawRest);

  try {
    // Atualiza os campos simples da iniciativa
    await prisma.initiative.update({
      where: { id },
      data: rest,
    });

    if (Array.isArray(removedMilestoneIds) && removedMilestoneIds.length > 0) {
      await prisma.initiativeMilestone.deleteMany({
        where: {
          initiativeId: id,
          id: { in: removedMilestoneIds }
        }
      });
    }

    // Atualiza/cria apenas os milestones alterados
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
          initiativeId: id,
        };

        if (m.id) {
          milestone = await prisma.initiativeMilestone.upsert({
            where: { id: m.id },
            update: milestoneData,
            create: {
              id: m.id,
              ...milestoneData,
            },
          });
        } else {
          milestone = await prisma.initiativeMilestone.create({
            data: milestoneData,
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
              targetDate: t.targetDate,
              notes: t.notes,
              order: safeOrder,
              milestoneId: milestone.id,
            };

            if (t.id) {
              await prisma.milestoneTask.upsert({
                where: { id: t.id },
                update: taskData,
                create: {
                  id: t.id,
                  ...taskData,
                },
              });
            } else {
              await prisma.milestoneTask.create({
                data: taskData,
              });
            }
          }));
        }
      }));
    }

    if (Array.isArray(comments)) {
      await prisma.initiativeComment.deleteMany({ where: { initiativeId: id } });
      if (comments.length > 0) {
        await prisma.initiativeComment.createMany({
          data: comments.map((c: any) => ({
            content: c.content,
            userId: c.userId,
            userName: c.userName,
            userPhoto: c.userPhoto,
            timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
            initiativeId: id,
          }))
        });
      }
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
          initiativeId: id,
        }))
      });
    }

    // Retorna a iniciativa atualizada com milestones e tasks
    const updated = await prisma.initiative.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { tasks: { orderBy: { order: 'asc' } } }
        },
        history: true,
        comments: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('API Error /api/initiatives/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update initiative', details: error.message });
  }
});

app.delete('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Manually delete related records if Cascade is not set/reliable at schema level. 
    await prisma.initiativeMilestone.deleteMany({ where: { initiativeId: id } });
    await prisma.initiativeHistory.deleteMany({ where: { initiativeId: id } });
    await prisma.allocation.deleteMany({ where: { initiativeId: id } });
    await prisma.initiative.delete({ where: { id } });
    res.json({ message: 'Initiative deleted' });
  } catch (error) {
    console.error('API Error /api/initiatives/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete initiative' });
  }
});

// --- Teams ---
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: getCommonWhere(req)
    });
    res.json(teams);
  } catch (error) {
    console.error('API Error /api/teams [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const data = sanitizeTeam(req.body);
    await ensureCompanyMatchesDept(data);

    const team = await prisma.team.create({ data: data as any });
    res.json(team);
  } catch (error: any) {
    console.error('API Error /api/teams [POST]:', error);
    res.status(500).json({ error: 'Failed to create team', details: error.message });
  }
});

app.patch('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeTeam(req.body);

    const team = await prisma.team.update({
      where: { id },
      data: data as any
    });
    res.json(team);
  } catch (error: any) {
    console.error('API Error /api/teams/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update team', details: error.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.team.delete({ where: { id } });
    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('API Error /api/teams/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// --- Collaborators ---
app.get('/api/collaborators', async (req, res) => {
  try {
    const collaborators = (await prisma.collaborator.findMany({
      where: getCommonWhere(req),
      select: collaboratorSafeSelect
    })).map(c => ({
      ...c,
      role: (c.role === 'Engineer/Analyst' || c.role === 'ENGINEER/ANALYST') ? 'Engineer' : c.role
    }));
    res.json(collaborators);
  } catch (error) {
    console.error('API Error /api/collaborators [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

app.post('/api/collaborators', async (req, res) => {
  try {
    const data = sanitizeCollaborator(req.body);

    const collaborator = await prisma.collaborator.create({ 
      data: data as any,
      include: {
        absences: true,
        skills: { include: { skill: true } }
      }
    });
    res.json(collaborator);
  } catch (error: any) {
    console.error('API Error /api/collaborators [POST]:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um colaborador com este e-mail corporativo.' });
    }
    res.status(500).json({ error: 'Failed to create collaborator', details: error.message });
  }
});

app.patch('/api/collaborators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeCollaborator(req.body);
    await ensureCompanyMatchesDept(data);

    const collaborator = await prisma.collaborator.update({
      where: { id },
      data: data as any,
      include: {
        absences: true,
        skills: { include: { skill: true } }
      }
    });
    res.json(collaborator);
  } catch (error: any) {
    console.error('API Error /api/collaborators/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update collaborator', details: error.message });
  }
});

app.delete('/api/collaborators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const collaborator = await prisma.collaborator.findUnique({ where: { id } });
    if (!collaborator) return res.status(404).json({ error: 'Collaborator not found' });

    await prisma.collaborator.delete({ where: { id } });
    res.json({ message: 'Collaborator deleted' });
  } catch (error: any) {
    console.error('API Error /api/collaborators/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete collaborator', details: error.message });
  }
});

// --- Vendors ---
const VALID_VENDOR_FIELDS = new Set([
  'companyId', 'departmentId', 'companyName', 'taxId', 'type', 'logoUrl', 'directorId', 'managerId'
]);

function sanitizeVendor(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_VENDOR_FIELDS.has(key)) clean[key] = data[key];
  }
  return clean;
}

app.get('/api/vendors', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    console.log('Fetching vendors with filter:', JSON.stringify(where));
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { companyName: 'asc' }
    });
    console.log('Found', vendors.length, 'vendors');
    res.json(vendors);
  } catch (error: any) {
    console.error('API Error /api/vendors [GET]:', error?.message || error);
    if (error?.stack) console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch vendors', 
      details: error?.message,
      code: error?.code
    });
  }
});

app.get('/api/vendors-context', async (req, res) => {
  try {
    const where = getCommonWhere(req);

    // Filter companies/departments by the same companyId to enforce data isolation
    const companyWhere = where.companyId ? { id: where.companyId } : {};
    const deptWhere = where.companyId ? { companyId: where.companyId } : {};

    const [vendors, contracts, systems, collaborators, companies, departments] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: { contracts: true, systems: true },
        orderBy: { companyName: 'asc' }
      }),
      prisma.contract.findMany({ where }),
      prisma.system.findMany({ where }),
      prisma.collaborator.findMany({ where, select: collaboratorSafeSelect }),
      prisma.company.findMany({ where: companyWhere }),
      prisma.department.findMany({ where: deptWhere })
    ]);

    res.json({
      vendors,
      contracts,
      systems,
      collaborators,
      companies,
      departments
    });
  } catch (error) {
    console.error('API Error /api/vendors-context [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch vendors context' });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    const data = sanitizeVendor(req.body);
    await ensureCompanyMatchesDept(data);
    const vendor = await prisma.vendor.create({ data: data as any });
    res.json(vendor);
  } catch (error: any) {
    console.error('API Error /api/vendors [POST]:', error);
    res.status(500).json({ error: 'Failed to create vendor', details: error.message });
  }
});

app.patch('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeVendor(req.body);
    await ensureCompanyMatchesDept(data);
    const vendor = await prisma.vendor.update({
      where: { id },
      data: data as any
    });
    res.json(vendor);
  } catch (error: any) {
    console.error('API Error /api/vendors/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update vendor', details: error.message });
  }
});

app.delete('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.vendor.delete({ where: { id } });
    res.json({ message: 'Vendor deleted' });
  } catch (error: any) {
    console.error('API Error /api/vendors/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete vendor', details: error.message });
  }
});

// --- Contracts ---
const VALID_CONTRACT_FIELDS = new Set([
  'companyId', 'departmentId', 'vendorId', 'number', 'startDate', 'endDate', 'model', 'annualCost'
]);

function sanitizeContract(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_CONTRACT_FIELDS.has(key)) clean[key] = data[key];
  }
  return clean;
}

app.get('/api/contracts', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    console.log('Fetching contracts with filter:', JSON.stringify(where));
    const contracts = await prisma.contract.findMany({
      where
    });
    console.log('Found', contracts.length, 'contracts');
    res.json(contracts);
  } catch (error: any) {
    console.error('API Error /api/contracts [GET]:', error?.message || error);
    if (error?.stack) console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch contracts', 
      details: error?.message,
      code: error?.code
    });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const data = sanitizeContract(req.body);
    await ensureCompanyMatchesDept(data);
    const contract = await prisma.contract.create({ data: data as any });
    res.json(contract);
  } catch (error: any) {
    console.error('API Error /api/contracts [POST]:', error);
    res.status(500).json({ error: 'Failed to create contract', details: error.message });
  }
});

app.patch('/api/contracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeContract(req.body);
    await ensureCompanyMatchesDept(data);
    const contract = await prisma.contract.update({
      where: { id },
      data: data as any
    });
    res.json(contract);
  } catch (error: any) {
    console.error('API Error /api/contracts/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update contract', details: error.message });
  }
});

app.delete('/api/contracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.contract.delete({ where: { id } });
    res.json({ message: 'Contract deleted' });
  } catch (error: any) {
    console.error('API Error /api/contracts/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete contract', details: error.message });
  }
});

// --- Allocations ---
app.get('/api/allocations', async (_req, res) => {
  try {
    const allocations = await prisma.allocation.findMany();
    res.json(allocations);
  } catch (error) {
    console.error('API Error /api/allocations [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// --- Departments ---
app.get('/api/departments', async (_req, res) => {
  try {
    const departments = await prisma.department.findMany();
    res.json(departments);
  } catch (error) {
    console.error('API Error /api/departments [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

app.patch('/api/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const department = await prisma.department.update({
      where: { id },
      data: req.body
    });
    res.json(department);
  } catch (error) {
    console.error('API Error /api/departments/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

app.post('/api/departments', async (req, res) => {
  const { masterUser, masterUserId, ...deptData } = req.body;
  try {
    const department = await prisma.$transaction(async (tx) => {
      const newDept = await tx.department.create({
        data: deptData
      });

      if (masterUserId) {
        // Assign existing collaborator as Master
        await tx.collaborator.update({
          where: { id: masterUserId },
          data: {
            role: 'Master',
            departmentId: newDept.id,
            companyId: deptData.companyId
          }
        });
      } else if (masterUser && masterUser.email && masterUser.name) {
        // Create new collaborator as Master
        await tx.collaborator.create({
          data: {
            name: masterUser.name,
            email: masterUser.email,
            password: masterUser.password || '123456',
            role: 'Master',
            companyId: deptData.companyId,
            departmentId: newDept.id,
            isAdmin: false,
            photoUrl: masterUser.photoUrl || ''
          }
        });
      }
      return newDept;
    });
    res.json(department);
  } catch (error: any) {
    console.error('API Error /api/departments [POST]:', error);
    res.status(500).json({ error: 'Failed to create department', details: error.message });
  }
});

app.patch('/api/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { masterUser, masterUserId, ...deptData } = req.body;
  try {
    const department = await prisma.$transaction(async (tx) => {
      // Remove id from deptData to avoid Prisma update errors
      const { id: _, ...updateData } = deptData;
      const updatedDept = await tx.department.update({
        where: { id },
        data: updateData
      });

      if (masterUserId) {
        // 1. Demote current masters
        await tx.collaborator.updateMany({
          where: { departmentId: id, role: 'Master' },
          data: { role: 'Operacional' }
        });

        // 2. Assign existing collaborator as Master
        await tx.collaborator.update({
          where: { id: masterUserId },
          data: {
            role: 'Master',
            departmentId: id,
            companyId: updatedDept.companyId
          }
        });
        
        // 3. Update department masterUserId
        await tx.department.update({
          where: { id },
          data: { masterUserId }
        });
      } else if (masterUser && masterUser.email && masterUser.name) {
        // 1. Demote current masters
        await tx.collaborator.updateMany({
          where: { departmentId: id, role: 'Master' },
          data: { role: 'Operacional' }
        });

        // 2. Create new collaborator as Master
        const newMaster = await tx.collaborator.create({
          data: {
            name: masterUser.name,
            email: masterUser.email,
            password: masterUser.password || '123456',
            role: 'Master',
            companyId: updatedDept.companyId,
            departmentId: id,
            isAdmin: false,
            photoUrl: masterUser.photoUrl || ''
          }
        });

        // 3. Update department masterUserId
        await tx.department.update({
          where: { id },
          data: { masterUserId: newMaster.id }
        });
      }
      return updatedDept;
    });
    res.json(department);
  } catch (error: any) {
    console.error('API Error /api/departments/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update department', details: error.message });
  }
});

// --- Companies ---
app.get('/api/companies', async (_req, res) => {
  try {
    const companies = await prisma.company.findMany();
    res.json(companies);
  } catch (error) {
    console.error('API Error /api/companies [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const company = await prisma.company.create({
      data: req.body
    });
    res.json(company);
  } catch (error) {
    console.error('API Error /api/companies [POST]:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.patch('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.update({
      where: { id },
      data: req.body
    });
    res.json(company);
  } catch (error) {
    console.error('API Error /api/companies/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Company deleted' });
  } catch (error) {
    console.error('API Error /api/companies/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// --- Skills API ---
app.get('/api/skills', async (req, res) => {
  const { companyId, departmentId } = req.query;
  try {
    const where: any = {};
    if (companyId) where.companyId = companyId as string;
    if (departmentId) where.departmentId = departmentId as string;

    const list = await prisma.skill.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        familia: true,
        icon: true,
        companyId: true,
        departmentId: true,
        collaborators: {
          select: {
            collaborator: {
              select: { id: true, name: true, photoUrl: true, role: true }
            }
          }
        }
      }
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

app.post('/api/skills', async (req, res) => {
  const { memberIds, ...skillData } = req.body;
  try {
    const skill = await prisma.$transaction(async (tx) => {
      const newSkill = await tx.skill.create({
        data: skillData
      });

      if (memberIds && Array.isArray(memberIds)) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map(cid => ({
            collaboratorId: cid,
            skillId: newSkill.id
          }))
        });
      }
      return newSkill;
    }, { timeout: 10000 });
    res.json(skill);
  } catch (error: any) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill', details: error.message });
  }
});

app.patch('/api/skills/:id', async (req, res) => {
  const { id } = req.params;
  const { id: _, collaborators, memberIds, ...updateData } = req.body;
  console.log(`PATCH /api/skills/${id} — memberIds:`, memberIds);
  try {
    const skill = await prisma.$transaction(async (tx) => {
      const _updated = await tx.skill.update({
        where: { id },
        data: updateData
      });

      // Always sync collaborators (even empty array = remove all)
      await tx.collaboratorSkill.deleteMany({
        where: { skillId: id }
      });
      if (Array.isArray(memberIds) && memberIds.length > 0) {
        await tx.collaboratorSkill.createMany({
          data: memberIds.map((cid: string) => ({
            collaboratorId: cid,
            skillId: id
          }))
        });
      }

      // Return skill with collaborators populated
      return tx.skill.findUnique({
        where: { id },
        include: {
          collaborators: {
            include: {
              collaborator: { select: { id: true, name: true, photoUrl: true, role: true } }
            }
          }
        }
      });
    }, { timeout: 10000 });
    console.log(`PATCH /api/skills/${id} — saved collaborators:`, (skill as any)?.collaborators?.length);
    res.json(skill);
  } catch (error: any) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill', details: error.message });
  }
});

app.delete('/api/skills/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.collaboratorSkill.deleteMany({ where: { skillId: id } });
    await prisma.skill.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

app.post('/api/collaborators/skills/toggle', async (req, res) => {
  const { collaboratorId, skillId, active } = req.body;
  try {
    if (active) {
      await prisma.collaboratorSkill.upsert({
        where: { collaboratorId_skillId: { collaboratorId, skillId } },
        create: { collaboratorId, skillId },
        update: {}
      });
    } else {
      await prisma.collaboratorSkill.deleteMany({
        where: { collaboratorId, skillId }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle skill' });
  }
});

// --- Absences ---
app.get('/api/absences', async (req, res) => {
  const { companyId, departmentId, teamId } = req.query;
  try {
    const absences = await prisma.absence.findMany({
      where: {
        collaborator: {
          companyId: companyId as string,
          departmentId: departmentId as string,
          squadId: teamId ? (teamId as string) : undefined
        }
      },
      include: { collaborator: true }
    });
    res.json(absences);
  } catch (error) {
    console.error('API Error /api/absences [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

app.post('/api/absences', async (req, res) => {
  try {
    const absence = await prisma.absence.create({
      data: req.body,
      include: { collaborator: true }
    });
    res.json(absence);
  } catch (error) {
    console.error('API Error /api/absences [POST]:', error);
    res.status(500).json({ error: 'Failed to create absence' });
  }
});

app.delete('/api/absences/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.absence.delete({ where: { id } });
    res.json({ message: 'Absence deleted' });
  } catch (error) {
    console.error('API Error /api/absences/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete absence' });
  }
});

// --- Holidays ---
app.get('/api/holidays', async (req, res) => {
  const { companyId } = req.query;
  try {
    const holidays = await prisma.holiday.findMany({
      where: {
        OR: [
          { companyId: companyId as string },
          { companyId: null }
        ]
      }
    });
    res.json(holidays);
  } catch (error) {
    console.error('API Error /api/holidays [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

app.post('/api/holidays', async (req, res) => {
  try {
    const holiday = await prisma.holiday.create({
      data: req.body
    });
    res.json(holiday);
  } catch (error) {
    console.error('API Error /api/holidays [POST]:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

app.delete('/api/holidays/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.holiday.delete({ where: { id } });
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    console.error('API Error /api/holidays/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

export default app;

