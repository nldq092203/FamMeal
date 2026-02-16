#!/bin/sh
set -e

echo "⏳ Running database migrations..."
node -e "
const { execSync } = require('child_process');
// Retry migration up to 5 times (DB might still be starting)
let retries = 5;
while (retries > 0) {
  try {
    execSync('node dist/scripts/migrate.js', { stdio: 'inherit' });
    console.log('✅ Migrations complete');
    break;
  } catch (err) {
    retries--;
    if (retries === 0) {
      console.error('❌ Migrations failed after 5 attempts');
      process.exit(1);
    }
    console.log('⚠️  Migration attempt failed, retrying in 3s... (' + retries + ' left)');
    execSync('sleep 3');
  }
}
"

echo "🚀 Starting server..."
exec node dist/index.js
