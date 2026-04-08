#!/usr/bin/env node
const path = require('path');
const cwd = process.cwd();

console.log('CWD:', cwd);
console.log('Starting API server...');

// Set environment variable to allow Prisma to bypass SSL issues if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Dynamically import and start the app
(async () => {
  try {
    // tsx/esm module loading    
    const { default: app } = await import('./src/app.ts');
    
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      console.log(`✓ API Server running on http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
      console.log(`✓ Server is ready to handle requests`);
    });
    
    server.on('error', (err) => {
      console.error('\n✗ Server error:', err);
      process.exit(1);
    });
    
    process.on('SIGTERM', () => {
      console.log('\nGracefully shutting down...');
      server.close(() => process.exit(0));
    });
    
  } catch (error) {
    console.error('\n✗ Failed to start server:', error);
    process.exit(1);
  }
})();
