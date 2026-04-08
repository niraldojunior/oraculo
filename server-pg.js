import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { Pool } from 'pg';

// Carregar .env.local primeiro, depois .env
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const PORT = Number(process.env.PORT || 3001);

if (!DATABASE_URL) {
  console.error('Falta DATABASE_URL no .env.local ou .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_req, res) => {
  console.log('[GET /api/health] Ping recebido');
  res.json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    console.log(`[POST /api/auth/login] Tentativa de login com email: ${normalizedEmail}`);
    const result = await pool.query(
      `SELECT id, email, password, name, "isAdmin", "companyId", "departmentId", role, "associatedCompanyIds"
       FROM "Collaborator"
       WHERE email = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    const collaborator = result.rows[0];
    if (!collaborator) {
      console.log(`[POST /api/auth/login] Usuário não encontrado: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (collaborator.password !== password) {
      console.log(`[POST /api/auth/login] Senha incorreta para: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    console.log(`[POST /api/auth/login] Login bem-sucedido para: ${normalizedEmail}`);
    return res.json({
      user: collaborator,
      isAdmin: collaborator.isAdmin || false,
      type: 'collaborator'
    });
  } catch (error) {
    console.error('[POST /api/auth/login] Erro:', error.message);
    return res.status(500).json({ error: 'Erro no servidor: ' + error.message });
  }
});

app.get('/api/collaborators/email/:email', async (req, res) => {
  try {
    const normalizedEmail = String(req.params.email).trim().toLowerCase();
    console.log(`[GET /api/collaborators/email] Buscando email: ${normalizedEmail}`);
    const result = await pool.query(
      `SELECT id, name, email, role, "companyId", "departmentId", "photoUrl", phone, bio,
              "linkedinUrl", "githubUrl", "isAdmin", "squadId", "associatedCompanyIds"
       FROM "Collaborator"
       WHERE email = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    const collaborator = result.rows[0];
    if (!collaborator) {
      console.log(`[GET /api/collaborators/email] Usuário não encontrado: ${normalizedEmail}`);
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    console.log(`[GET /api/collaborators/email] Usuário encontrado: ${collaborator.id}`);
    return res.json(collaborator);
  } catch (error) {
    console.error('[GET /api/collaborators/email] Erro:', error.message);
    return res.status(500).json({ error: 'Erro no servidor: ' + error.message });
  }
});

app.get('/api/companies', async (_req, res) => {
  try {
    console.log('[GET /api/companies] Buscando empresas...');
    const result = await pool.query(
      `SELECT id, "fantasyName", "realName", logo, description FROM "Company" ORDER BY "fantasyName"`);
    console.log(`[GET /api/companies] Encontradas ${result.rows.length} empresas`);
    return res.json(result.rows);
  } catch (error) {
    console.error('[GET /api/companies] Erro:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar empresas: ' + error.message });
  }
});

app.get('/api/departments', async (_req, res) => {
  try {
    console.log('[GET /api/departments] Buscando departamentos...');
    const result = await pool.query(
      `SELECT id, name, "companyId" FROM "Department" ORDER BY name`);
    console.log(`[GET /api/departments] Encontrados ${result.rows.length} departamentos`);
    return res.json(result.rows);
  } catch (error) {
    console.error('[GET /api/departments] Erro:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar departamentos: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Supabase PG Server running on http://localhost:${PORT}`);
  console.log(`Test endpoint available at: http://localhost:${PORT}/api/test-login`);
});

// Endpoint de teste para debug
app.post('/api/test-login', (_req, res) => {
  console.log('[POST /api/test-login] Login de teste');
  res.json({
    user: {
      id: 'test-123',
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: false,
      companyId: 'comp-1',
      departmentId: 'dept-1',
      role: 'Engineer'
    },
    isAdmin: false,
    type: 'test'
  });
});
