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

const VALID_SYSTEM_FIELDS = new Set([
  'id', 'name', 'platformName', 'domain', 'subDomain', 'criticality',
  'techStack', 'ownerTeamId', 'smeId', 'lifecycleStatus', 'debtScore',
  'description', 'platformCategory', 'vendorId', 'repoUrl', 'environments', 'contextFiles'
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
  'name', 'email', 'role', 'squadId', 'photoUrl', 'phone', 'bio', 'skills', 'linkedinUrl', 'githubUrl'
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
  'name', 'type', 'parentTeamId', 'leaderId'
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

const VALID_INITIATIVE_SCALAR_FIELDS = new Set([
  'title', 'type', 'benefit', 'benefitType', 'scope', 'customerOwner',
  'originDirectorate', 'leaderId', 'technicalLeadId', 'impactedSystemIds',
  'businessExpectationDate', 'status', 'previousStatus'
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

// --- Vendors ---
app.get('/api/vendors', async (_req, res) => {
  try {
    const vendors = await prisma.vendor.findMany();
    res.json(vendors);
  } catch (error) {
    console.error('API Error /api/vendors [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// --- Contracts ---
app.get('/api/contracts', async (_req, res) => {
  try {
    const contracts = await prisma.contract.findMany();
    res.json(contracts);
  } catch (error) {
    console.error('API Error /api/contracts [GET]:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

export default app;
