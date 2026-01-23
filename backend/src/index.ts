import 'dotenv/config';
import { buildApp } from '@/app.js';
import { env } from '@/config/env.js';
import { closeDatabase } from '@/config/database.js';
import { initCache, closeCache } from '@/shared/cache/index.js';
import type { FastifyInstance } from 'fastify';
import { logger, logException } from '@/shared/logger.js';

/**
 * Start the server
 */
let app: FastifyInstance | undefined;

const start = async (): Promise<void> => {
  try {
    await initCache();
    app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info({ host: env.HOST, port: env.PORT }, 'Server started');
    logger.info({ url: `http://${env.HOST}:${env.PORT}/health` }, 'Health check');
  } catch (err) {
    logException(err, 'Error starting server');
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Shutting down gracefully');

  try {
    await app?.close();
    await closeCache();
    await closeDatabase();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logException(err, 'Error during shutdown');
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
start();
