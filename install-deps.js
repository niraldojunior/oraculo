const { execSync } = require('child_process');
const path = require('path');

const cwd = path.resolve(__dirname);
console.log('Installing npm dependencies in:', cwd);

try {
  execSync('npm install', {
    cwd,
    stdio: 'inherit',
    environment: process.env
  });
  console.log('\n✓ npm install completed successfully');
  process.exit(0);
} catch (e) {
  console.error('\n✗ npm install failed:', e.message);
  process.exit(1);
}
