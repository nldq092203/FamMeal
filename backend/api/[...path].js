module.exports.config = { runtime: 'nodejs' };

const path = require('node:path');
const moduleAlias = require('module-alias');

// dist is copied to api/_dist at build time
const distDir = path.join(__dirname, '_dist');

// Make "@/..." resolve inside the bundled output
moduleAlias.addAlias('@', distDir);

// IMPORTANT: buildApp is in _dist/src/app.js (because source is src/app.ts)
const { buildApp } = require('./_dist/src/app.js');

let appPromise;
let readyPromise;

async function getApp() {
  if (!appPromise) appPromise = buildApp();
  const app = await appPromise;

  if (!readyPromise) {
    readyPromise = Promise.resolve(app.ready()).then(() => undefined);
  }
  await readyPromise;

  return app;
}

// Handle Vercel catch-all that comes as ?path=...
function normalizeVercelCatchAllUrl(req) {
  if (typeof req.url !== 'string') return;

  const u = new URL(req.url, 'http://local');
  const p = u.searchParams.get('path');
  if (!p) return;

  // Remove the special param
  u.searchParams.delete('path');
  const rest = u.searchParams.toString();

  // If pathname is "/" then the real path is inside ?path=
  let finalPath = u.pathname;
  if (finalPath === '/' || finalPath === '') {
    finalPath = '/' + p.replace(/^\/+/, '');
  }

  req.url = rest ? `${finalPath}?${rest}` : finalPath;
}

module.exports = async function handler(req, res) {
  normalizeVercelCatchAllUrl(req);

  const app = await getApp();
  app.server.emit('request', req, res);
};
