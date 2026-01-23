import { and, eq, gt, lt, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/index.js';
import { familyMembers } from '@/db/schema/family-member.table.js';
import { notifications } from '@/db/schema/notification.table.js';
import { scheduledNotifications } from '@/db/schema/scheduled-notification.table.js';
import { cronState } from '@/db/schema/cron-state.table.js';
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
 * Hourly (or less frequent) cron job that processes all schedules due in (last_run_at, now].
 * Uses a DB advisory lock so only one run does work.
 */
export async function runNotificationSchedulerWindowedJob(params?: {
  jobName?: string;
  now?: Date;
  limit?: number;
}): Promise<{ jobName: string; lastRunAt: Date; now: Date; due: number; processed: number; failed: number; skipped: boolean }> {
  const jobName = params?.jobName ?? 'send_notifications';
  const now = params?.now ?? new Date();
  const limit = params?.limit ?? 500;

  const lockKey = advisoryLockKey(jobName);

  const lockResult = await db.execute<{ locked: boolean }>(
    sql`select pg_try_advisory_lock(${lockKey}) as locked`
  );

  const locked = Boolean(lockResult[0]?.locked);
  if (!locked) {
    logger.warn({ jobName }, 'notification-jobs: scheduler window job skipped (lock held)');
    return { jobName, lastRunAt: new Date(0), now, due: 0, processed: 0, failed: 0, skipped: true };
  }

  try {
    // Ensure state row exists (first run starts at epoch to avoid missing items)
    await db
      .insert(cronState)
      .values({ jobName, lastRunAt: new Date(0) })
      .onConflictDoNothing();

    const [state] = await db
      .select({ lastRunAt: cronState.lastRunAt })
      .from(cronState)
      .where(eq(cronState.jobName, jobName));

    const lastRunAt = state?.lastRunAt ?? new Date(0);

    const dueRows = await db
      .select({
        id: scheduledNotifications.id,
      })
      .from(scheduledNotifications)
      .where(and(
        eq(scheduledNotifications.status, 'PENDING'),
        gt(scheduledNotifications.scheduledAt, lastRunAt),
        lte(scheduledNotifications.scheduledAt, now)
      ))
      .orderBy(scheduledNotifications.scheduledAt)
      .limit(limit);

    let processed = 0;
    let failed = 0;

    for (const due of dueRows) {
      try {
        await db.transaction(async (tx) => {
          const txDb = tx as unknown as typeof db;
          const txService = new NotificationService(txDb);

          // Re-read inside tx to ensure status is still PENDING
          const [schedule] = await tx
            .select({
              id: scheduledNotifications.id,
              familyId: scheduledNotifications.familyId,
              type: scheduledNotifications.type,
              refId: scheduledNotifications.refId,
              scheduledAt: scheduledNotifications.scheduledAt,
              status: scheduledNotifications.status,
            })
            .from(scheduledNotifications)
            .where(eq(scheduledNotifications.id, due.id));

          if (!schedule) return;
          if (schedule.status !== 'PENDING') return;
          if (!(schedule.scheduledAt > lastRunAt && schedule.scheduledAt <= now)) return;

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
        logger.error({ err, scheduleId: due.id }, 'notification-jobs: failed to process schedule (will retry)');
      }
    }

    await db
      .insert(cronState)
      .values({ jobName, lastRunAt: now })
      .onConflictDoUpdate({
        target: cronState.jobName,
        set: { lastRunAt: now },
      });

    return { jobName, lastRunAt, now, due: dueRows.length, processed, failed, skipped: false };
  } finally {
    await db.execute(sql`select pg_advisory_unlock(${lockKey})`);
  }
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

function advisoryLockKey(jobName: string): bigint {
  // FNV-1a 64-bit
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < jobName.length; i++) {
    hash ^= BigInt(jobName.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  // Cast to signed bigint range accepted by pg_advisory_lock(bigint)
  if (hash > 0x7fffffffffffffffn) {
    return hash - 0x10000000000000000n;
  }
  return hash;
}
