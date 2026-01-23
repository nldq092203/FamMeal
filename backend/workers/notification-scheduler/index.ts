import 'dotenv/config';
import { startNotificationScheduler } from './scheduler.js';
import { closeDatabase } from '@/config/database.js';
import { logger } from '@/shared/logger.js';

const scheduler = startNotificationScheduler();

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'notification-scheduler: shutting down');
  try {
    scheduler.stop();
    await closeDatabase();
    logger.info('notification-scheduler: shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'notification-scheduler: shutdown error');
    process.exit(1);
  }
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

