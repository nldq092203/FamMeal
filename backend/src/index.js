require('dotenv').config();
const { env } = require('./config/env');
const { logger, logException } = require('./shared/logger');
const { connectDatabase, closeDatabase } = require('./config/database');
const { initCache, closeCache } = require('./shared/cache');
const { buildApp } = require('./app');

require('./db/models');

let server;

async function start() {
  try {
    await initCache();
    await connectDatabase();

    const app = buildApp();

    server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`Server started on http://${env.HOST}:${env.PORT}`);
      logger.info(`Health check: http://${env.HOST}:${env.PORT}/health`);
    });
  } catch (err) {
    logException(err, 'Error starting server');
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeCache();
    await closeDatabase();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logException(err, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
