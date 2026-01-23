module.exports.config = { runtime: 'nodejs' };

const path = require('node:path');
const moduleAlias = require('module-alias');

const distDir = path.join(__dirname, '_dist');
moduleAlias.addAlias('@', distDir);

// Your build output is under api/_dist/src/...
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

function normalizeVercelCatchAllUrl(req) {
  if (typeof req.url !== 'string') return;

  // Vercel sometimes passes catch-all as "/?path=api/users"
  const u = new URL(req.url, 'http://local');
  const p = u.searchParams.get('path');
  if (!p) return;

  // remove the special param and rebuild url
  u.searchParams.delete('path');
  const rest = u.searchParams.toString();
  const realPath = '/' + p.replace(/^\/+/, '');

  req.url = rest ? `${realPath}?${rest}` : realPath;
}

module.exports = async function handler(req, res) {
  normalizeVercelCatchAllUrl(req);

  const app = await getApp();
  app.server.emit('request', req, res);
};
