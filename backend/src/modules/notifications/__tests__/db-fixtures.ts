import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { notifications } from '@/db/schema/notification.table';
import { scheduledNotifications } from '@/db/schema/scheduled-notification.table';
import { users } from '@/db/schema/user.table';
import { families } from '@/db/schema/family.table';

export const TEST_IDS = {
  user1: '550e8400-e29b-41d4-a716-446655440000',
  user2: '550e8400-e29b-41d4-a716-446655440010',
  family1: '550e8400-e29b-41d4-a716-446655440001',
  family2: '550e8400-e29b-41d4-a716-446655440099',
  proposal1: '550e8400-e29b-41d4-a716-446655440002',
  meal1: '550e8400-e29b-41d4-a716-446655440003',
} as const;

const testUserIds = [TEST_IDS.user1, TEST_IDS.user2] as const;
const testFamilyIds = [TEST_IDS.family1, TEST_IDS.family2] as const;

export async function cleanupNotificationTestData(): Promise<void> {
  await db.delete(notifications).where(inArray(notifications.userId, [...testUserIds]));
  await db
    .delete(scheduledNotifications)
    .where(inArray(scheduledNotifications.familyId, [...testFamilyIds]));
  await db.delete(users).where(inArray(users.id, [...testUserIds]));
  await db.delete(families).where(inArray(families.id, [...testFamilyIds]));
}

export async function seedNotificationTestData(): Promise<void> {
  await db
    .insert(families)
    .values([
      { id: TEST_IDS.family1, name: 'Test Family' },
    ])
    .onConflictDoNothing();

  await db
    .insert(users)
    .values([
      {
        id: TEST_IDS.user1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hash',
      },
      {
        id: TEST_IDS.user2,
        username: 'otheruser',
        name: 'Other User',
        email: 'other@example.com',
        password: 'hash',
      },
    ])
    .onConflictDoNothing();
}
