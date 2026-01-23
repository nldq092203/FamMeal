import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { useNotificationTestDb, TEST_IDS } from './test-cleanup';
import { familyMembers } from '@/db/schema/family-member.table';
import { scheduledNotifications } from '@/db/schema/scheduled-notification.table';
import { notifications } from '@/db/schema/notification.table';
import { and, eq } from 'drizzle-orm';
import { NotificationType } from '@/shared/notifications';
import { runNotificationSchedulerTick } from '@/modules/notifications/notification.jobs';

describe('notification-scheduler', () => {
  useNotificationTestDb();

  beforeEach(async () => {
    await db
      .insert(familyMembers)
      .values([
        { familyId: TEST_IDS.family1, userId: TEST_IDS.user1, role: 'MEMBER' },
        { familyId: TEST_IDS.family1, userId: TEST_IDS.user2, role: 'MEMBER' },
      ])
      .onConflictDoNothing();
  });

  it('processes due schedules atomically and is retry-safe via dedupe', async () => {
    const scheduledAt = new Date(Date.now() - 60_000);

    const [s1] = await db
      .insert(scheduledNotifications)
      .values({
        familyId: TEST_IDS.family1,
        type: NotificationType.REMINDER,
        refId: TEST_IDS.meal1,
        scheduledAt,
        status: 'PENDING',
      })
      .returning({ id: scheduledNotifications.id });

    const [s2] = await db
      .insert(scheduledNotifications)
      .values({
        familyId: TEST_IDS.family1,
        type: NotificationType.REMINDER,
        refId: TEST_IDS.meal1,
        scheduledAt,
        status: 'PENDING',
      })
      .returning({ id: scheduledNotifications.id });

    expect(s1?.id).toBeTruthy();
    expect(s2?.id).toBeTruthy();

    await runNotificationSchedulerTick({ limit: 100 });

    const schedules = await db
      .select({ id: scheduledNotifications.id, status: scheduledNotifications.status })
      .from(scheduledNotifications)
      .where(and(eq(scheduledNotifications.familyId, TEST_IDS.family1)));

    const statusById = new Map(schedules.map((s) => [s.id, s.status]));
    expect(statusById.get(s1!.id)).toBe('DONE');
    expect(statusById.get(s2!.id)).toBe('DONE');

    const createdNotifications = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.familyId, TEST_IDS.family1),
        eq(notifications.type, NotificationType.REMINDER),
        eq(notifications.refId, TEST_IDS.meal1)
      ));

    // Only 2 family members, so should not double-create even with duplicate schedules.
    expect(createdNotifications).toHaveLength(2);

    // Second run should be a no-op (no pending schedules left).
    await runNotificationSchedulerTick({ limit: 100 });

    const createdAfterSecondRun = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.familyId, TEST_IDS.family1),
        eq(notifications.type, NotificationType.REMINDER),
        eq(notifications.refId, TEST_IDS.meal1)
      ));

    expect(createdAfterSecondRun).toHaveLength(2);
  });
});
