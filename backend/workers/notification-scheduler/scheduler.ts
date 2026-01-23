import cron, { type ScheduledTask } from 'node-cron';
import { and, eq, lt, or } from 'drizzle-orm';
import { db } from '@/db/index.js';
import { familyMembers } from '@/db/schema/family-member.table.js';
import { NotificationService } from '@/modules/notifications/notification.service.js';
import { logger } from '@/shared/logger.js';
import { notifications } from '@/db/schema/notification.table.js';
import { scheduledNotifications } from '@/db/schema/scheduled-notification.table.js';

async function getFamilyMemberIds(
  tx: typeof db,
  familyId: string
): Promise<string[]> {
  const rows = await tx
    .select({ userId: familyMembers.userId })
    .from(familyMembers)
    .where(eq(familyMembers.familyId, familyId));

  return rows.map((r) => r.userId);
}

export const notificationRetention = {
  readDeleteAfterDays: 20,
  anyDeleteAfterDays: 60,
} as const;

export const scheduleRetention = {
  doneDeleteAfterDays: 14,
  canceledDeleteAfterDays: 1,
} as const;

function daysAgo(days: number, now: Date): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Daily DB cleanup (no NotificationService).
 *
 * Retention rules:
 * - Read notifications: delete after 20 days
 * - Any notifications: delete after 60 days
 * - DONE scheduled_notifications: delete after 14 days
 * - CANCELED scheduled_notifications: delete after 1 day
 */
export async function runNotificationCleanupJob(params?: { now?: Date }): Promise<{
  deletedNotifications: number;
  deletedSchedules: number;
}> {
  const now = params?.now ?? new Date();

  const readCutoff = daysAgo(notificationRetention.readDeleteAfterDays, now);
  const anyCutoff = daysAgo(notificationRetention.anyDeleteAfterDays, now);
  const doneCutoff = daysAgo(scheduleRetention.doneDeleteAfterDays, now);
  const canceledCutoff = daysAgo(scheduleRetention.canceledDeleteAfterDays, now);

  const deletedNotificationsRows = await db
    .delete(notifications)
    .where(or(
      and(eq(notifications.isRead, true), lt(notifications.createdAt, readCutoff)),
      lt(notifications.createdAt, anyCutoff)
    ))
    .returning({ id: notifications.id });

  const deletedScheduleRows = await db
    .delete(scheduledNotifications)
    .where(or(
      and(eq(scheduledNotifications.status, 'DONE'), lt(scheduledNotifications.createdAt, doneCutoff)),
      and(eq(scheduledNotifications.status, 'CANCELED'), lt(scheduledNotifications.createdAt, canceledCutoff))
    ))
    .returning({ id: scheduledNotifications.id });

  logger.info(
    {
      deletedNotifications: deletedNotificationsRows.length,
      deletedSchedules: deletedScheduleRows.length,
    },
    'notification-scheduler: cleanup complete'
  );

  return {
    deletedNotifications: deletedNotificationsRows.length,
    deletedSchedules: deletedScheduleRows.length,
  };
}

export async function runNotificationSchedulerTick(params?: {
  now?: Date;
  limit?: number;
}): Promise<void> {
  const service = new NotificationService();
  const due = await service.listDue({ now: params?.now, limit: params?.limit ?? 100 });

  for (const schedule of due) {
    try {
      await db.transaction(async (tx) => {
        const txDb = tx as unknown as typeof db;
        const txService = new NotificationService(txDb);

        const memberIds = await getFamilyMemberIds(txDb, schedule.familyId);

        const result = await txService.createForUsers({
          users: memberIds,
          familyId: schedule.familyId,
          type: schedule.type,
          refId: schedule.refId,
        });

        await txService.markScheduledDone(schedule.id);

        logger.info(
          {
            scheduleId: schedule.id,
            familyId: schedule.familyId,
            type: schedule.type,
            created: result.created,
          },
          'notification-scheduler: processed schedule'
        );
      });
    } catch (err) {
      logger.error(
        {
          err,
          scheduleId: schedule.id,
          familyId: schedule.familyId,
          type: schedule.type,
        },
        'notification-scheduler: failed to process schedule (will retry)'
      );
    }
  }
}

export type SchedulerHandle = {
  stop: () => void;
};

export function startNotificationScheduler(): SchedulerHandle {
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
      await runNotificationSchedulerTick({ limit: 100, now: new Date() });
    } finally {
      const endedAt = new Date();
      logger.info(
        { endedAt: endedAt.toISOString(), durationMs: endedAt.getTime() - startedAt.getTime() },
        'notification-scheduler: tick end'
      );
      running = false;
    }
  };

  // Every minute, UTC only
  const task: ScheduledTask = cron.schedule(
    '* * * * *',
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
