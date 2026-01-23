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

  const u = new URL(req.url, 'http://local');
  const p = u.searchParams.get('path');
  if (!p) return;

  // Remove the special "path" param
  u.searchParams.delete('path');
  const rest = u.searchParams.toString();

  // If req.url already has a pathname like "/api/health",
  // Vercel may set path="health" or path="api/health".
  // We prefer the *real path* from "p" only when pathname is "/" (or empty).
  // Otherwise keep current pathname.
  let finalPath = u.pathname;

  // If Vercel routed everything to "/" and put the real path in ?path=...
  if (finalPath === '/' || finalPath === '') {
    finalPath = '/' + p.replace(/^\/+/, '');
  }

  req.url = rest ? `${finalPath}?${rest}` : finalPath;
}
