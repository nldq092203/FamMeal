module.exports.config = { runtime: 'nodejs' };

const path = require('node:path');
const moduleAlias = require('module-alias');

const distDir = path.join(__dirname, '_dist');
moduleAlias.addAlias('@', distDir);

// ✅ In your bundle, app is under _dist/src/app.js
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

module.exports = async function handler(req, res) {
  const app = await getApp();
  app.server.emit('request', req, res);
};
