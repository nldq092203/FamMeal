// Vercel serverless entrypoint for the Fastify app.
//
// NOTE: Vercel's runtime does not honor TypeScript path aliases like "@/*".
// We register a runtime alias for "@/*" so imports work inside the bundled function output.

module.exports.config = {
  runtime: 'nodejs',
};

let appPromise;
let readyPromise;

async function getApp() {
  if (!appPromise) {
    const fs = require('fs');
    const path = require('path');
    // eslint-disable-next-line global-require
    const moduleAlias = require('module-alias');

    const rootDir = path.join(__dirname, '..');
    const srcDir = path.join(rootDir, 'src');

    const srcApp = path.join(srcDir, 'app.js');
    // Register runtime alias so "@/..." resolves to bundled src output.
    moduleAlias.addAlias('@', srcDir);

    if (!fs.existsSync(srcApp)) {
      throw new Error(`Expected ${srcApp} to exist in the Vercel function bundle`);
    }

    // eslint-disable-next-line global-require, import/no-dynamic-require
    const { buildApp } = require(srcApp);
    appPromise = buildApp();
  }

  const app = await appPromise;

  if (!readyPromise) {
    readyPromise = Promise.resolve(app.ready()).then(() => undefined);
  }

  await readyPromise;
  return app;
}

module.exports = async function handler(req, res) {
  // Vercel's catch-all api route may strip the /api prefix; ensure Fastify sees it.
  if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = req.url.startsWith('/') ? `/api${req.url}` : `/api/${req.url}`;
  }

  const app = await getApp();
  app.server.emit('request', req, res);
};
