module.exports.config = { runtime: 'nodejs' };

const path = require('node:path');
const moduleAlias = require('module-alias');

// Make "@/..." resolve to the compiled output
// Because compiled files are in backend/dist/config, backend/dist/modules, ...
moduleAlias.addAlias('@', path.join(__dirname, '..', 'dist'));

// Static require so Vercel bundles it correctly
const { buildApp } = require('../dist/src/app.js');

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

function stripVercelPathParam(req) {
  if (typeof req.url !== 'string') return;

  const u = new URL(req.url, 'http://local');
  if (!u.searchParams.has('path')) return;

  // Vercel sometimes appends ?path=...
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
    // IMPORTANT: return something so it doesn't become FUNCTION_INVOCATION_FAILED
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
