#!/usr/bin/env node
/**
 * Simple Express server for Oráculo API
 * Handles all vendor and contract endpoints with basic Prisma queries
 */
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';  
import { join } from 'path';

// Setup
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT || 3001);

console.log('[BACKEND] Starting with fresh backend.ts file');
console.log('[BACKEND] Port:', PORT);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to build where clause from query params
function getCommonWhere(req) {
  const where = {};
  if (req.query.companyId) where.companyId = String(req.query.companyId);
  if (req.query.departmentId) where.departmentId = String(req.query.departmentId);
  return where;
}

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/api/vendors', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    console.log('[VENDORS GET] Query:', JSON.stringify(where));
    
    const vendors = await prisma.vendor.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { companyName: 'asc' }
    });
    
    console.log('[VENDORS GET] Found', vendors.length, 'vendors');
    res.json(vendors);
  } catch (error) {
    console.error('[VENDORS GET] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch vendors', details: error?.message });
  }
});

app.get('/api/contracts', async (req, res) => {
  try {
    const where = getCommonWhere(req);
    console.log('[CONTRACTS GET] Query:', JSON.stringify(where));
    
    const contracts = await prisma.contract.findMany({
      where: Object.keys(where).length > 0 ? where : undefined
    });
    
    console.log('[CONTRACTS GET] Found', contracts.length, 'contracts');
    res.json(contracts);
  } catch (error) {
    console.error('[CONTRACTS GET] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch contracts', details: error?.message });
  }
});

// Start server ONLY if running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`[BACKEND] API Server running on http://localhost:${PORT}`);
    console.log('[BACKEND] This is backend.ts - fresh minimal server');
  });
}

export default app;
