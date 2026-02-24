const fs = require('fs');
const path = require('path');

function loadTestEnv() {
  const repoRoot = path.resolve(__dirname, '../../');
  const envTestPath = path.join(repoRoot, '.env.test');
  const envPath = fs.existsSync(envTestPath) ? envTestPath : path.join(repoRoot, '.env');
  require('dotenv').config({ path: envPath, override: true });
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
}

loadTestEnv();

const { sequelize } = require('../config/database');
require('../db/models');

module.exports = async function globalSetup() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    await sequelize.close();
  } catch (err) {
    console.error('Global setup failed:', err);
    process.exit(1);
  }
};
