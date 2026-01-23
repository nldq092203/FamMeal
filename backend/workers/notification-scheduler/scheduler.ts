import cron, { type ScheduledTask } from 'node-cron';
import { env } from '@/config/env.js';
import { logger } from '@/shared/logger.js';
import { runNotificationCleanupJob, runNotificationSchedulerWindowedJob } from '@/modules/notifications/notification.jobs.js';

export type SchedulerHandle = {
  stop: () => void;
};

export function startNotificationScheduler(): SchedulerHandle {
  // Deactivated by default (use Vercel Cron or explicit enablement).
  if (!env.CRON_ENABLED) {
    logger.warn('notification-scheduler: CRON_ENABLED=false, not starting any scheduled tasks');
    return { stop: () => {} };
  }

  let running = false;

  const runOnce = async (): Promise<void> => {
    if (running) {
      logger.warn('notification-scheduler: previous run still in progress; skipping tick');
      return;
    }

    running = true;
    const startedAt = new Date();
    logger.info({ startedAt: startedAt.toISOString() }, 'notification-scheduler: tick start');

    try {
      await runNotificationSchedulerWindowedJob({ limit: 200, now: new Date() });
    } finally {
      const endedAt = new Date();
      logger.info(
        { endedAt: endedAt.toISOString(), durationMs: endedAt.getTime() - startedAt.getTime() },
        'notification-scheduler: tick end'
      );
      running = false;
    }
  };

  // Hourly, UTC only
  const task: ScheduledTask = cron.schedule(
    '0 * * * *',
    () => {
      void runOnce();
    },
    { timezone: 'UTC' }
  );

  // Daily cleanup at 03:00 UTC
  const cleanupTask: ScheduledTask = cron.schedule(
    '0 3 * * *',
    () => {
      void runNotificationCleanupJob();
    },
    { timezone: 'UTC' }
  );

  // Start immediately (then cron keeps it going)
  void runOnce();

  return {
    stop: () => {
      task.stop();
      cleanupTask.stop();
    },
  };
}
