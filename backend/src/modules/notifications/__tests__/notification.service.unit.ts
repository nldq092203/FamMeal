import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationService, type CreateNotificationInput } from '../notification.service';
import { NotificationType } from '@/shared/notifications';
import { ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors';
import { db } from '@/db';
import { notifications } from '@/db/schema/notification.table';
import { families } from '@/db/schema/family.table';
import { TEST_IDS, useNotificationTestDb } from './test-cleanup';
import { eq, inArray } from 'drizzle-orm';

/**
 * Clean Unit Test Suite for NotificationService
 * Uses database transactions for proper isolation - all data cleaned up after each test
 */

// Test data constants
const VALID_USER_ID = TEST_IDS.user1;
const OTHER_USER_ID = TEST_IDS.user2;
const VALID_FAMILY_ID = TEST_IDS.family1;
const OTHER_FAMILY_ID = TEST_IDS.family2;
const VALID_PROPOSAL_ID = TEST_IDS.proposal1;
const VALID_MEAL_ID = TEST_IDS.meal1;
const INVALID_UUID = 'not-a-uuid';

describe('NotificationService', () => {
  let service: NotificationService;

  useNotificationTestDb();

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('Input Validation', () => {
    it('should reject invalid user UUID', async () => {
      const input: CreateNotificationInput = {
        userId: INVALID_UUID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
      };

      await expect(service.createForUser(input)).rejects.toThrow(ValidationError);
    });

    it('should reject invalid family UUID', async () => {
      const input: CreateNotificationInput = {
        userId: VALID_USER_ID,
        familyId: INVALID_UUID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
      };

      await expect(service.createForUser(input)).rejects.toThrow(ValidationError);
    });

    it('should reject invalid refId UUID', async () => {
      const input: CreateNotificationInput = {
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: INVALID_UUID,
      };

      await expect(service.createForUser(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('createForUser', () => {
    it('should create a single notification', async () => {
      const input: CreateNotificationInput = {
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
      };

      await service.createForUser(input);

      const count = await db.select().from(notifications);
      expect(count).toHaveLength(1);
      expect(count[0]).toMatchObject({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
        isRead: false,
      });
    });

    it('should be idempotent - duplicate notifications are ignored', async () => {
      const input: CreateNotificationInput = {
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
      };

      await service.createForUser(input);
      await service.createForUser(input);

      const count = await db.select().from(notifications);
      expect(count).toHaveLength(1);
    });

    it('should handle null refId', async () => {
      const input: CreateNotificationInput = {
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.REMINDER,
        refId: null,
      };

      await service.createForUser(input);

      const count = await db.select().from(notifications);
      expect(count).toHaveLength(1);
      expect(count[0]!.refId).toBeNull();
    });
  });

  describe('createForUsers', () => {
    beforeEach(async () => {
      // Clear notifications for this test suite
      await db
        .delete(notifications)
        .where(inArray(notifications.userId, [VALID_USER_ID, OTHER_USER_ID]));
    });

    it('should create batch notifications for multiple users', async () => {
      const result = await service.createForUsers({
        users: [VALID_USER_ID, OTHER_USER_ID],
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_FINALIZED,
        refId: VALID_MEAL_ID,
      });

      expect(result.created).toBe(2);

      const count = await db.select().from(notifications);
      expect(count).toHaveLength(2);
    });

    it('should deduplicate user IDs in batch creation', async () => {
      const result = await service.createForUsers({
        users: [VALID_USER_ID, VALID_USER_ID, VALID_USER_ID],
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_FINALIZED,
        refId: '650e8400-e29b-41d4-a716-446655440005',
      });

      expect(result.created).toBe(1);

      const count = await db.select().from(notifications);
      expect(count).toHaveLength(1);
    });

    it('should require familyId and refId for batch creation', async () => {
      await expect(
        service.createForUsers({
          users: [VALID_USER_ID],
          familyId: null as any,
          type: NotificationType.MEAL_FINALIZED,
          refId: VALID_MEAL_ID,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createForUsers({
          users: [VALID_USER_ID],
          familyId: VALID_FAMILY_ID,
          type: NotificationType.MEAL_FINALIZED,
          refId: null as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should return 0 for empty user list', async () => {
      const result = await service.createForUsers({
        users: [],
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_FINALIZED,
        refId: VALID_MEAL_ID,
      });

      expect(result.created).toBe(0);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create test notifications
      await service.createForUser({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.createForUser({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_FINALIZED,
        refId: VALID_MEAL_ID,
      });
    });

    it('should list notifications in descending order by createdAt', async () => {
      const items = await service.list({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        limit: 20,
      });

      expect(items).toHaveLength(2);
      expect(items[0]!.type).toBe(NotificationType.MEAL_FINALIZED);
      expect(items[1]!.type).toBe(NotificationType.MEAL_PROPOSAL);
    });

    it('should respect limit parameter', async () => {
      const items = await service.list({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        limit: 1,
      });

      expect(items).toHaveLength(1);
    });

    it('should scope notifications by family', async () => {
      await db
        .insert(families)
        .values({ id: OTHER_FAMILY_ID, name: 'Other Family' })
        .onConflictDoNothing();

      await service.createForUser({
        userId: VALID_USER_ID,
        familyId: OTHER_FAMILY_ID,
        type: NotificationType.MEMBER_JOINED,
        refId: null,
      });

      const items = await service.list({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        limit: 20,
      });

      expect(items).toHaveLength(2);
      items.forEach((item) => {
        expect([NotificationType.MEAL_PROPOSAL, NotificationType.MEAL_FINALIZED]).toContain(item.type);
      });
    });
  });

  describe('unreadCount', () => {
    beforeEach(async () => {
      await service.createForUser({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
      });

      await service.createForUser({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_FINALIZED,
        refId: VALID_MEAL_ID,
      });
    });

    it('should count unread notifications', async () => {
      const count = await service.unreadCount({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      expect(count).toBe(2);
    });

    it('should return 0 when no unread notifications', async () => {
      // Mark all as read
      const items = await service.list({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        limit: 20,
      });

      for (const item of items) {
        await service.markAsRead({
          notificationId: item.id,
          userId: VALID_USER_ID,
          familyId: VALID_FAMILY_ID,
        });
      }

      const count = await service.unreadCount({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    let notificationId: string;

    beforeEach(async () => {
      await service.createForUser({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: VALID_PROPOSAL_ID,
      });

      const items = await service.list({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        limit: 1,
      });

      notificationId = items[0]!.id;
    });

    it('should mark notification as read', async () => {
      await service.markAsRead({
        notificationId,
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      const items = await service.list({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
        limit: 20,
      });

      expect(items[0]!.isRead).toBe(true);
      expect(items[0]!.readAt).not.toBeNull();
    });

    it('should be idempotent', async () => {
      await service.markAsRead({
        notificationId,
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      const firstRead = (
        await db.select().from(notifications)
      )[0]!.readAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.markAsRead({
        notificationId,
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      const secondRead = (
        await db.select().from(notifications)
      )[0]!.readAt;

      expect(firstRead).toEqual(secondRead);
    });

    it('should reject wrong user', async () => {
      await expect(
        service.markAsRead({
          notificationId,
          userId: OTHER_USER_ID,
          familyId: VALID_FAMILY_ID,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(async () => {
      // Clear notifications for this test suite
      await db.delete(notifications).where(eq(notifications.userId, VALID_USER_ID));

      await service.createForUsers({
        users: [VALID_USER_ID],
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_PROPOSAL,
        refId: '750e8400-e29b-41d4-a716-446655440006',
      });

      await service.createForUsers({
        users: [VALID_USER_ID],
        familyId: VALID_FAMILY_ID,
        type: NotificationType.MEAL_FINALIZED,
        refId: '750e8400-e29b-41d4-a716-446655440007',
      });
    });

    it('should mark all notifications as read and return count', async () => {
      const count = await service.markAllAsRead({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      expect(count).toBe(2);

      const unreadCount = await service.unreadCount({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      expect(unreadCount).toBe(0);
    });

    it('should be idempotent', async () => {
      const firstCount = await service.markAllAsRead({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      const secondCount = await service.markAllAsRead({
        userId: VALID_USER_ID,
        familyId: VALID_FAMILY_ID,
      });

      expect(firstCount).toBe(2);
      expect(secondCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundError for non-existent family', async () => {
      const nonExistentFamilyId = '550e8400-e29b-41d4-a716-446655440098';

      await expect(
        service.createForUser({
          userId: VALID_USER_ID,
          familyId: nonExistentFamilyId,
          type: NotificationType.MEAL_PROPOSAL,
          refId: VALID_PROPOSAL_ID,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440099';

      await expect(
        service.createForUser({
          userId: nonExistentUserId,
          familyId: VALID_FAMILY_ID,
          type: NotificationType.MEAL_PROPOSAL,
          refId: VALID_PROPOSAL_ID,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when marking non-existent notification', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await expect(
        service.markAsRead({
          notificationId: nonExistentId,
          userId: VALID_USER_ID,
          familyId: VALID_FAMILY_ID,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
