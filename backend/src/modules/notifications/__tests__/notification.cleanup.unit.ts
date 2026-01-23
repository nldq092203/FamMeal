import { describe, it, expect } from 'vitest';
import { db } from '@/db';
import { useNotificationTestDb, TEST_IDS } from './test-cleanup';
import { notifications } from '@/db/schema/notification.table';
import { scheduledNotifications } from '@/db/schema/scheduled-notification.table';
import { and, eq } from 'drizzle-orm';
import { NotificationType } from '@/shared/notifications';
import { runNotificationCleanupJob } from '@/modules/notifications/notification.jobs';

describe('notification-cleanup', () => {
  useNotificationTestDb();

  it('deletes old data and keeps recent data (retention rules)', async () => {
    const now = new Date('2026-01-23T03:00:00.000Z');

    const days = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    // Notifications
    await db.insert(notifications).values([
      // Read > 20d => delete
      {
        userId: TEST_IDS.user1,
        familyId: TEST_IDS.family1,
        type: NotificationType.MEAL_FINALIZED,
        refId: TEST_IDS.meal1,
        isRead: true,
        readAt: days(21),
        createdAt: days(21),
      },
      // Any > 60d => delete (even if unread)
      {
        userId: TEST_IDS.user2,
        familyId: TEST_IDS.family1,
        type: NotificationType.MEAL_PROPOSAL,
        refId: TEST_IDS.proposal1,
        isRead: false,
        readAt: null,
        createdAt: days(61),
      },
      // Unread 30d => keep
      {
        userId: TEST_IDS.user1,
        familyId: TEST_IDS.family1,
        type: NotificationType.MEMBER_JOINED,
        refId: null,
        isRead: false,
        readAt: null,
        createdAt: days(30),
      },
      // Read 10d => keep
      {
        userId: TEST_IDS.user2,
        familyId: TEST_IDS.family1,
        type: NotificationType.COOK_ASSIGNED,
        refId: TEST_IDS.meal1,
        isRead: true,
        readAt: days(10),
        createdAt: days(10),
      },
    ]);

    // Scheduled notifications
    await db.insert(scheduledNotifications).values([
      // DONE > 14d => delete
      {
        familyId: TEST_IDS.family1,
        type: NotificationType.REMINDER,
        refId: TEST_IDS.meal1,
        scheduledAt: days(15),
        status: 'DONE',
        createdAt: days(15),
      },
      // DONE 5d => keep
      {
        familyId: TEST_IDS.family1,
        type: NotificationType.REMINDER,
        refId: TEST_IDS.meal1,
        scheduledAt: days(5),
        status: 'DONE',
        createdAt: days(5),
      },
      // CANCELED > 1d => delete
      {
        familyId: TEST_IDS.family1,
        type: NotificationType.REMINDER,
        refId: TEST_IDS.meal1,
        scheduledAt: days(2),
        status: 'CANCELED',
        createdAt: days(2),
      },
      // CANCELED 12h => keep
      {
        familyId: TEST_IDS.family1,
        type: NotificationType.REMINDER,
        refId: TEST_IDS.meal1,
        scheduledAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        status: 'CANCELED',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      // PENDING old => keep (not part of retention rules)
      {
        familyId: TEST_IDS.family1,
        type: NotificationType.REMINDER,
        refId: TEST_IDS.meal1,
        scheduledAt: days(90),
        status: 'PENDING',
        createdAt: days(90),
      },
    ]);

    const result = await runNotificationCleanupJob({ now });
    expect(result.deletedNotifications).toBe(2);
    expect(result.deletedSchedules).toBe(2);

    const remainingNotifications = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(eq(notifications.familyId, TEST_IDS.family1));
    expect(remainingNotifications).toHaveLength(2);

    const remainingSchedules = await db
      .select({ status: scheduledNotifications.status })
      .from(scheduledNotifications)
      .where(and(eq(scheduledNotifications.familyId, TEST_IDS.family1)));
    expect(remainingSchedules.map((s) => s.status).sort()).toEqual(['CANCELED', 'DONE', 'PENDING'].sort());
  });
});
