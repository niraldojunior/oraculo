import { Pool } from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function insertTestUser() {
  try {
    console.log('Conectando ao Supabase...');
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Collaborator'
      )`
    );
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Tabela Collaborator não existe no banco');
      process.exit(1);
    }
    
    console.log('✅ Tabela Collaborator encontrada');
    
    // Inserir usuário de teste
    const result = await pool.query(
      `INSERT INTO "Collaborator" (
        id, email, password, name, role, "isAdmin", "companyId", "departmentId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET password = $3
      RETURNING id, email, name`,
      [
        'user-' + Date.now(),
        'niraldo.junior@vtal.com',
        'senha123',
        'Niraldo Junior',
        'Engineer',
        true,
        'comp-1',
        'dept-1'
      ]
    );
    
    console.log('✅ Usuário de teste criado/atualizado:');
    console.log('📧 Email:', result.rows[0].email);
    console.log('🔐 Senha: senha123');
    console.log('👤 Nome:', result.rows[0].name);
    
    // Verificar quantos usuários existem
    const countRes = await pool.query('SELECT COUNT(*) FROM "Collaborator"');
    console.log(`\n📊 Total de usuários na tabela: ${countRes.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

insertTestUser();
