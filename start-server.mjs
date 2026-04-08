#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  // Import the app
  console.log('Loading app from', path.join(__dirname, 'src', 'app.ts'));
  const app = await import('./src/app.ts');
  console.log('App loaded successfully');
  
  const PORT = process.env.PORT || 3001;
  const server = app.default.listen(PORT, () => {
    console.log(`✓ API Server running on http://localhost:${PORT}`);
    console.log('✓ Health check: http://localhost:' + PORT + '/api/health');
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
