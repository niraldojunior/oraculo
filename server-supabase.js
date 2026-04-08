import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

// Carregar .env.local primeiro, depois .env
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const app = express();
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

// Login endpoint with Supabase
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { email: email.trim().toLowerCase() },
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

    if (collaborator && collaborator.password === password) {
      return res.json({
        user: collaborator,
        isAdmin: collaborator.isAdmin || false,
        type: 'collaborator'
      });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Mock systems endpoint
app.get('/api/systems', (req, res) => {
  res.json([{ id: '1', name: 'Sistema Mock', status: 'active' }]);
});

app.listen(PORT, () => {
  console.log('Supabase API Server running on http://localhost:' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/api/health');
  console.log('Login: conectado ao Supabase');
});