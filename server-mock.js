import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

// Carregar .env.local primeiro, depois .env
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Basic login endpoint (mock)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  // Mock authentication
  if (email === 'admin@oraculo.com' && password === 'admin123') {
    return res.json({
      user: {
        id: '1',
        email: 'admin@oraculo.com',
        name: 'Admin',
        isAdmin: true
      },
      isAdmin: true,
      type: 'mock'
    });
  }

  res.status(401).json({ error: 'Credenciais inválidas (modo mock)' });
});

// Mock systems endpoint
app.get('/api/systems', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Sistema de Gestão',
      description: 'Sistema principal de gestão',
      status: 'active'
    }
  ]);
});

app.listen(PORT, () => {
  console.log('Mock API Server running on http://localhost:' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/api/health');
  console.log('Login mock: admin@oraculo.com / admin123');
});