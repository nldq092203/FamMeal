require('dotenv').config();

require('../src/db/models');

const { buildApp } = require('../src/app');
const { connectDatabase } = require('../src/config/database');
const { initCache } = require('../src/shared/cache');

let app;
let initPromise;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      await Promise.all([initCache(), connectDatabase()]);
      app = buildApp();
    })();
    initPromise.catch(() => {
      initPromise = undefined;
    });
  }
  await initPromise;
  return app;
}

module.exports = async (req, res) => {
  const expressApp = await ensureInitialized();
  return expressApp(req, res);
};
