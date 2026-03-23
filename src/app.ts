import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/systems', async (_req, res) => {
  try {
    const systems = await prisma.system.findMany();
    res.json(systems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch systems' });
  }
});

app.post('/api/systems', async (req, res) => {
  try {
    const system = await prisma.system.create({
      data: req.body
    });
    res.json(system);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create system' });
  }
});

app.patch('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const system = await prisma.system.update({
      where: { id },
      data: req.body
    });
    res.json(system);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system' });
  }
});

app.delete('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.system.delete({
      where: { id }
    });
    res.json({ message: 'System deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete system' });
  }
});

app.get('/api/initiatives', async (_req, res) => {
  try {
    const initiatives = await prisma.initiative.findMany({
      include: { milestones: true, history: true }
    });
    res.json(initiatives);
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to fetch initiative' });
  }
});

app.post('/api/initiatives', async (req, res) => {
  const { milestones, history, ...rest } = req.body;
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
      },
      include: { milestones: true, history: true }
    });
    res.json(initiative);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create initiative' });
  }
});

app.patch('/api/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  const { milestones, history, ...rest } = req.body;
  try {
    // For simplicity in this demo/migration, we'll delete and recreate milestones/history
    // In a prod app, we'd use upsert or specific updates.
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
      },
      include: { milestones: true, history: true }
    });
    res.json(initiative);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update initiative' });
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
    res.status(500).json({ error: 'Failed to delete initiative' });
  }
});

// --- Teams ---
app.get('/api/teams', async (_req, res) => {
  try {
    const teams = await prisma.team.findMany();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const team = await prisma.team.create({ data: req.body });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team' });
  }
});

app.patch('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const team = await prisma.team.update({
      where: { id },
      data: req.body
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.team.delete({ where: { id } });
    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// --- Collaborators ---
app.get('/api/collaborators', async (_req, res) => {
  try {
    const collaborators = await prisma.collaborator.findMany();
    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

app.post('/api/collaborators', async (req, res) => {
  try {
    const collaborator = await prisma.collaborator.create({ data: req.body });
    res.json(collaborator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create collaborator' });
  }
});

app.patch('/api/collaborators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const collaborator = await prisma.collaborator.update({
      where: { id },
      data: req.body
    });
    res.json(collaborator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update collaborator' });
  }
});

app.delete('/api/collaborators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.collaborator.delete({ where: { id } });
    res.json({ message: 'Collaborator deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete collaborator' });
  }
});

export default app;
