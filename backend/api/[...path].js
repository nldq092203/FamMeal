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
    const fs = require('fs');
    const path = require('path');
    // eslint-disable-next-line global-require
    const moduleAlias = require('module-alias');

    const rootDir = path.join(__dirname, '..');
    const distDir = path.join(rootDir, 'dist');
    const srcDir = path.join(rootDir, 'src');

    // Register runtime alias so "@/..." works even if build output isn't rewritten.
    // Prefer dist/ if it exists; otherwise fall back to src/.
    const aliasTarget = fs.existsSync(distDir) ? distDir : srcDir;
    moduleAlias.addAlias('@', aliasTarget);

    const distApp = path.join(distDir, 'app.js');
    const srcApp = path.join(srcDir, 'app.js');

    // Prefer compiled output; fall back to src/app.js if Vercel transpiled TS into src/.
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const { buildApp } = require(fs.existsSync(distApp) ? distApp : srcApp);
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
