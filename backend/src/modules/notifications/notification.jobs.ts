import { and, eq, lt, or } from 'drizzle-orm';
import { db } from '@/db/index.js';
import { familyMembers } from '@/db/schema/family-member.table.js';
import { notifications } from '@/db/schema/notification.table.js';
import { scheduledNotifications } from '@/db/schema/scheduled-notification.table.js';
import { NotificationService } from '@/modules/notifications/notification.service.js';
import { logger } from '@/shared/logger.js';

async function getFamilyMemberIds(familyId: string, tx: typeof db = db): Promise<string[]> {
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
 * Every-minute scheduler tick.
 * Uses only NotificationService methods.
 */
export async function runNotificationSchedulerTick(params?: {
  now?: Date;
  limit?: number;
}): Promise<{ due: number; processed: number; failed: number }> {
  const service = new NotificationService();
  const due = await service.listDue({ now: params?.now, limit: params?.limit ?? 100 });

  let processed = 0;
  let failed = 0;

  for (const schedule of due) {
    try {
      await db.transaction(async (tx) => {
        const txDb = tx as unknown as typeof db;
        const txService = new NotificationService(txDb);

        const memberIds = await getFamilyMemberIds(schedule.familyId, txDb);

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
          'notification-jobs: processed schedule'
        );
      });

      processed += 1;
    } catch (err) {
      failed += 1;
      logger.error(
        {
          err,
          scheduleId: schedule.id,
          familyId: schedule.familyId,
          type: schedule.type,
        },
        'notification-jobs: failed to process schedule (will retry)'
      );
    }
  }

  return { due: due.length, processed, failed };
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
    'notification-jobs: cleanup complete'
  );

  return {
    deletedNotifications: deletedNotificationsRows.length,
    deletedSchedules: deletedScheduleRows.length,
  };
}
