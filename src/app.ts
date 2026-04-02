import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Auth Endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Try Collaborator
    let collaborator = await prisma.collaborator.findUnique({
      where: { email }
    });

    if (collaborator && (collaborator as any).password === password) {
      return res.json({
        user: collaborator,
        isAdmin: (collaborator as any).isAdmin || false,
        type: 'collaborator'
      });
    }

    // 2. Try User (Admin)
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user && user.password === password) {
      return res.json({
        user,
        isAdmin: true,
        type: 'admin'
      });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.get('/api/collaborators/email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { email }
    });
    if (!collaborator) return res.status(404).json({ error: 'Collaborator not found' });
    res.json(collaborator);
  } catch (error) {
    console.error('API Error /api/collaborators/email/:email [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch collaborator' });
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
      prisma.collaborator.findMany({ where }),
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
  'name', 'email', 'role', 'squadId', 'photoUrl', 'phone', 'bio', 'skills', 'linkedinUrl', 'githubUrl',
  'companyId', 'departmentId', 'password', 'isAdmin'
]);

function sanitizeCollaborator(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_COLLABORATOR_FIELDS.has(key)) clean[key] = data[key];
  }
  if (clean.squadId === '') clean.squadId = null;
  if (!Array.isArray(clean.skills)) clean.skills = [];

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

const VALID_USER_FIELDS = new Set([
  'fullName', 'email', 'password', 'photoUrl', 'role', 'associatedCompanyIds', 'phone'
]);

function sanitizeUser(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_USER_FIELDS.has(key)) clean[key] = data[key];
  }
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

const VALID_INITIATIVE_SCALAR_FIELDS = new Set([
  'title', 'type', 'benefit', 'benefitType', 'scope', 'customerOwner',
  'originDirectorate', 'leaderId', 'technicalLeadId', 'impactedSystemIds',
  'businessExpectationDate', 'status', 'previousStatus', 'companyId', 'departmentId', 'executingDirectorate', 'executingTeamId', 'rationale', 'macroScope', 'createdById', 'assignedManagerId', 'initiativeType', 'priority', 'memberIds', 'startDate', 'endDate'
]);

function sanitizeInitiative(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_INITIATIVE_SCALAR_FIELDS.has(key)) clean[key] = data[key];
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
    const initiatives = await prisma.initiative.findMany({
      where: getCommonWhere(req),
      include: {
        milestones: {
          include: { tasks: true }
        },
        history: true
      }
    });
    console.log(`[DEBUG] /api/initiatives called. Found ${initiatives.length} initiatives in DB.`);
    res.json(initiatives);
  } catch (error) {
    console.error('API Error /api/initiatives [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch initiatives' });
  }
});

app.get('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        milestones: {
          include: { tasks: true }
        },
        history: true
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
  const { milestones, history, ...rawRest } = req.body;
  const rest = sanitizeInitiative(rawRest);
  try {
    const initiative = await prisma.initiative.create({
      data: {
        ...rest,
        milestones: {
          create: milestones?.map((m: any) => ({
            name: m.name,
            systemId: m.systemId,
            baselineDate: m.baselineDate,
            realDate: m.realDate,
            description: m.description,
            assignedEngineerId: m.assignedEngineerId,
            startDate: m.startDate,
            tasks: {
              create: m.tasks?.map((t: any) => ({
                name: t.name,
                status: t.status,
                type: t.type,
                assigneeId: t.assigneeId,
                targetDate: t.targetDate
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
        }
      } as any,
      include: {
        milestones: { include: { tasks: true } },
        history: true
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
  const { milestones, history, ...rawRest } = req.body;
  const rest = sanitizeInitiative(rawRest);
  try {
    const initiative = await prisma.initiative.update({
      where: { id },
      data: {
        ...rest,
        milestones: {
          deleteMany: {},
          create: milestones?.map((m: any) => ({
            name: m.name,
            systemId: m.systemId,
            baselineDate: m.baselineDate,
            realDate: m.realDate,
            description: m.description,
            assignedEngineerId: m.assignedEngineerId,
            startDate: m.startDate,
            tasks: {
              create: m.tasks?.map((t: any) => ({
                name: t.name,
                status: t.status,
                type: t.type,
                assigneeId: t.assigneeId,
                targetDate: t.targetDate
              }))
            }
          }))
        },
        history: {
          deleteMany: {},
          create: history?.map((h: any) => ({
            timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
            user: h.user,
            action: h.action,
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            notes: h.notes
          }))
        }
      } as any,
      include: {
        milestones: { include: { tasks: true } },
        history: true
      }
    });
    res.json(initiative);
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
      where: getCommonWhere(req)
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

    const collaborator = await prisma.collaborator.create({ data: data as any });
    res.json(collaborator);
  } catch (error: any) {
    console.error('API Error /api/collaborators [POST]:', error);
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
      data: data as any
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

// --- Users ---
app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        photoUrl: true,
        role: true,
        associatedCompanyIds: true,
        phone: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('API Error /api/users [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        photoUrl: true,
        role: true,
        associatedCompanyIds: true,
        phone: true
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('API Error /api/users/email/:email [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = sanitizeUser(req.body);
    const user = await prisma.user.update({
      where: { id },
      data: data as any,
      select: {
        id: true,
        fullName: true,
        email: true,
        photoUrl: true,
        role: true,
        associatedCompanyIds: true,
        phone: true
      }
    });

    // Also update corresponding collaborator if email matches
    try {
      if (user.email) {
        await prisma.collaborator.updateMany({
          where: { email: user.email },
          data: {
            photoUrl: user.photoUrl,
            name: user.fullName,
            phone: user.phone
          }
        });
      }
    } catch (collabError) {
      console.warn('Could not update matching collaborator:', collabError);
      // Don't fail the main request
    }

    res.json(user);
  } catch (error: any) {
    console.error('API Error /api/users/:id [PATCH]:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
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
    const vendors = await prisma.vendor.findMany({
      where: getCommonWhere(req),
      include: { contracts: true, systems: true }
    });
    res.json(vendors);
  } catch (error) {
    console.error('API Error /api/vendors [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

app.get('/api/vendors-context', async (req, res) => {
  try {
    const where = getCommonWhere(req);

    const [vendors, contracts, systems, collaborators, companies, departments] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: { contracts: true, systems: true },
        orderBy: { companyName: 'asc' }
      }),
      prisma.contract.findMany({ where }),
      prisma.system.findMany({ where }),
      prisma.collaborator.findMany({ where }),
      prisma.company.findMany(),
      prisma.department.findMany()
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

app.get('/api/contracts', async (_req, res) => {
  try {
    const contracts = await prisma.contract.findMany();
    res.json(contracts);
  } catch (error) {
    console.error('API Error /api/contracts [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const data = sanitizeContract(req.body);
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
  const { masterUser, ...deptData } = req.body;
  try {
    const department = await prisma.$transaction(async (tx) => {
      const newDept = await tx.department.create({
        data: deptData
      });

      if (masterUser && masterUser.email && masterUser.name) {
        await tx.collaborator.create({
          data: {
            name: masterUser.name,
            email: masterUser.email,
            password: masterUser.password || '123456',
            role: 'Head',
            companyId: deptData.companyId,
            departmentId: newDept.id,
            isAdmin: false
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

app.delete('/api/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted' });
  } catch (error) {
    console.error('API Error /api/departments/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete department' });
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

export default app;

