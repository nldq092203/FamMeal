/**
 * Vercel Serverless Function entrypoint.
 *
 * Notes:
 * - We intentionally load the precompiled `dist/` output (built via `npm run vercel-build`)
 *   so TS path aliases (`@/...`) are already rewritten by `tsc-alias`.
 * - Fastify instance is cached across invocations within the same runtime.
 */

// Static require so Vercel bundles the built server code correctly
const { buildApp } = require('../dist/src/app.js');

let appPromise;
let readyPromise;

async function getApp() {
  if (!appPromise) appPromise = buildApp();
  const app = await appPromise;

  if (!readyPromise) readyPromise = Promise.resolve(app.ready()).then(() => undefined);
  await readyPromise;

  return app;
}

function stripVercelPathParam(req) {
  if (typeof req.url !== 'string') return;

  const u = new URL(req.url, 'http://local');
  if (!u.searchParams.has('path')) return;

  // Vercel can append ?path=... when routing to a function
  u.searchParams.delete('path');
  const rest = u.searchParams.toString();
  req.url = rest ? `${u.pathname}?${rest}` : u.pathname;
}

module.exports = async function handler(req, res) {
  try {
    stripVercelPathParam(req);

    const app = await getApp();
    app.server.emit('request', req, res);
  } catch (err) {
    console.error('Handler crash:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: { message: String(err), code: 'HANDLER_CRASH' },
      })
    );
  }
};

