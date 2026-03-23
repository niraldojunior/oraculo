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
    const initiatives = await prisma.initiative.findMany();
    res.json(initiatives);
  } catch (error) {
    res.status(500).json({ error: 'Failed to route initiatives' });
  }
});

export default app;
