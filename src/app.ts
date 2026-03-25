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

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/systems', async (_req, res) => {
  try {
    const systems = await prisma.system.findMany();
    res.json(systems);
  } catch (error) {
    console.error('API Error /api/systems [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch systems' });
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
  'companyId', 'departmentId'
]);

function sanitizeCollaborator(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_COLLABORATOR_FIELDS.has(key)) clean[key] = data[key];
  }
  if (clean.squadId === '') clean.squadId = null;
  if (!Array.isArray(clean.skills)) clean.skills = [];
  return clean;
}

const VALID_TEAM_FIELDS = new Set([
  'name', 'type', 'parentTeamId', 'leaderId', 'companyId', 'departmentId'
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

const VALID_INITIATIVE_SCALAR_FIELDS = new Set([
  'title', 'type', 'benefit', 'benefitType', 'scope', 'customerOwner',
  'originDirectorate', 'leaderId', 'technicalLeadId', 'impactedSystemIds',
  'businessExpectationDate', 'status', 'previousStatus', 'companyId', 'departmentId'
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

app.get('/api/initiatives', async (_req, res) => {
  try {
    const initiatives = await prisma.initiative.findMany({
      include: { milestones: true, history: true }
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
      include: { milestones: true, history: true }
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
            startDate: m.startDate
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
      include: { milestones: true, history: true }
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
            startDate: m.startDate
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
      include: { milestones: true, history: true }
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
    // Milestones and history should be deleted automatically if defined in schema with Cascade, 
    // but here we do it manually to be safe or if not defined.
    await prisma.initiativeMilestone.deleteMany({ where: { initiativeId: id } });
    await prisma.initiativeHistory.deleteMany({ where: { initiativeId: id } });
    await prisma.initiative.delete({ where: { id } });
    res.json({ message: 'Initiative deleted' });
  } catch (error) {
    console.error('API Error /api/initiatives/:id [DELETE]:', error);
    res.status(500).json({ error: 'Failed to delete initiative' });
  }
});

// --- Teams ---
app.get('/api/teams', async (_req, res) => {
  try {
    const teams = await prisma.team.findMany();
    res.json(teams);
  } catch (error) {
    console.error('API Error /api/teams [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const data = sanitizeTeam(req.body);
    
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
app.get('/api/collaborators', async (_req, res) => {
  try {
    const collaborators = await prisma.collaborator.findMany();
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

app.get('/api/vendors', async (_req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: { contracts: true, systems: true }
    });
    res.json(vendors);
  } catch (error) {
    console.error('API Error /api/vendors [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
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

export default app;
