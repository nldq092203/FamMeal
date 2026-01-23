// Vercel serverless entrypoint for the Fastify app.
//
// NOTE: Vercel's runtime does not honor TypeScript path aliases like "@/*".
// We load the compiled output from `dist/` where `tsc-alias` has rewritten imports.

module.exports.config = {
  runtime: 'nodejs',
};

let appPromise;
let readyPromise;

async function getApp() {
  if (!appPromise) {
    // eslint-disable-next-line global-require
    const { buildApp } = require('../dist/app.js');
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

