#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/app.ts' assert { type: 'loader' };

const PORT = process.env.PORT || 3001;

try {
  const server = app.listen(PORT, () => {
    console.log(`✓ API Server running on http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
  });
  
  server.on('error', (err) => {
    console.error('✗ Server error:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('✗ Failed to start server:', error);
  process.exit(1);
}
