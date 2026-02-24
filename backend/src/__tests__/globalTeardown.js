const fs = require('fs');
const path = require('path');

function loadTestEnv() {
  const repoRoot = path.resolve(__dirname, '../../');
  const envTestPath = path.join(repoRoot, '.env.test');
  const envPath = fs.existsSync(envTestPath) ? envTestPath : path.join(repoRoot, '.env');
  require('dotenv').config({ path: envPath });
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
}

loadTestEnv();

const { sequelize } = require('../config/database');

module.exports = async function globalTeardown() {
  try {
    await sequelize.close();
  } catch (_err) {
  }
};
