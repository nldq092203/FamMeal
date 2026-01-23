import type { IncomingMessage, ServerResponse } from 'http';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

export const config = {
  runtime: 'nodejs',
};

let appPromise: Promise<FastifyInstance> | undefined;
let readyPromise: Promise<void> | undefined;

async function getApp(): Promise<FastifyInstance> {
  if (!appPromise) appPromise = buildApp();
  const app = await appPromise;
  if (!readyPromise) readyPromise = Promise.resolve(app.ready()).then(() => undefined);
  await readyPromise;
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Vercel's catch-all api route may strip the /api prefix; ensure Fastify sees it.
  if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = req.url.startsWith('/') ? `/api${req.url}` : `/api/${req.url}`;
  }

  const app = await getApp();
  app.server.emit('request', req, res);
}
