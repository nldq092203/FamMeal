import { and, asc, count, desc, eq, inArray, lt, lte } from 'drizzle-orm';
import { db as defaultDb } from '@/db';
import { notifications } from '@/db/schema/notification.table';
import { scheduledNotifications } from '@/db/schema/scheduled-notification.table';
import { users } from '@/db/schema/user.table';
import { families } from '@/db/schema/family.table';
import type { NotificationTypeId, ScheduleStatus } from '@/shared/notifications.js';
import { ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors.js';

export type CreateNotificationInput = {
  userId: string;
  familyId: string | null;
  type: NotificationTypeId;
  refId?: string | null;
};

export type CreateNotificationsInput = {
  users: string[];
  familyId: string | null;
  type: NotificationTypeId;
  refId?: string | null;
};

export type NotificationItem = {
  id: string;
  type: NotificationTypeId;
  refId: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
};

export class NotificationService {
  constructor(private readonly db = defaultDb) {}

  private assertUuid(id: string, fieldName: string): void {
    // Accept any RFC4122 UUID (v1–v5); route-level validation may be stricter.
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(id)) {
      throw new ValidationError(`Invalid ${fieldName} format`);
    }
  }

  private async assertFamilyExists(familyId: string): Promise<void> {
    const [family] = await this.db
      .select({ id: families.id })
      .from(families)
      .where(eq(families.id, familyId));

    if (!family) {
      throw new NotFoundError('Family not found');
    }
  }

  private async assertUsersExist(userIds: string[]): Promise<void> {
    if (!userIds.length) return;

    const found = await this.db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, userIds));

    const foundSet = new Set(found.map((u) => u.id));
    const missing = userIds.filter((id) => !foundSet.has(id));

    if (missing.length) {
      throw new NotFoundError(missing.length === 1 ? `User ${missing[0]} not found` : 'Some users not found');
    }
  }

  /**
   * Create a notification for a single user.
   * Safe to retry: if (userId,familyId,type,refId) is unique, duplicates are ignored.
   */
  async createForUser(input: CreateNotificationInput): Promise<void> {
    this.assertUuid(input.userId, 'userId');
    if (input.familyId) this.assertUuid(input.familyId, 'familyId');
    if (input.refId) this.assertUuid(input.refId, 'refId');

    if (input.familyId) {
      await this.assertFamilyExists(input.familyId);
    }
    await this.assertUsersExist([input.userId]);

    await this.db
      .insert(notifications)
      .values({
        userId: input.userId,
        familyId: input.familyId,
        type: input.type,
        refId: input.refId ?? null,
      })
      .onConflictDoNothing({
        target: [notifications.userId, notifications.familyId, notifications.type, notifications.refId],
      });
  }

  /**
   * Create notifications for multiple users (batch).
   * Robust/idempotent for family-scoped event notifications (requires familyId + refId).
   */
  async createForUsers(input: CreateNotificationsInput): Promise<{ created: number }> {
    if (!input.users.length) return { created: 0 };

    if (!input.familyId) {
      throw new ValidationError('familyId is required for createForUsers');
    }
    if (!input.refId) {
      throw new ValidationError('refId is required for createForUsers');
    }

    this.assertUuid(input.familyId, 'familyId');
    this.assertUuid(input.refId, 'refId');

    const uniqueUserIds = Array.from(new Set(input.users));
    uniqueUserIds.forEach((id) => this.assertUuid(id, 'userId'));

    await this.assertFamilyExists(input.familyId);
    await this.assertUsersExist(uniqueUserIds);

    const inserted = await this.db
      .insert(notifications)
      .values(
        uniqueUserIds.map((userId) => ({
          userId,
          familyId: input.familyId,
          type: input.type,
          refId: input.refId,
        }))
      )
      .onConflictDoNothing({
        target: [notifications.userId, notifications.familyId, notifications.type, notifications.refId],
      })
      .returning({ id: notifications.id });

    return { created: inserted.length };
  }

  /**
   * List notifications for a user within a family, newest first.
   */
  async list(params: {
    userId: string;
    familyId: string;
    limit: number;
    cursor?: Date;
  }): Promise<NotificationItem[]> {
    this.assertUuid(params.userId, 'userId');
    this.assertUuid(params.familyId, 'familyId');

    const limit = Math.min(Math.max(params.limit, 1), 100);

    return await this.db
      .select({
        id: notifications.id,
        type: notifications.type,
        refId: notifications.refId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
      })
      .from(notifications)
      .where(and(
        eq(notifications.userId, params.userId),
        eq(notifications.familyId, params.familyId),
        ...(params.cursor ? [lt(notifications.createdAt, params.cursor)] : [])
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  /**
   * Count unread notifications for a user within a family.
   */
  async unreadCount(params: { userId: string; familyId: string }): Promise<number> {
    this.assertUuid(params.userId, 'userId');
    this.assertUuid(params.familyId, 'familyId');

    const [row] = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, params.userId),
        eq(notifications.familyId, params.familyId),
        eq(notifications.isRead, false)
      ));

    return row?.count ?? 0;
  }

  /**
   * Mark a single notification as read (idempotent).
   * Verifies notification existence, user ownership, and family scope.
   */
  async markAsRead(params: { notificationId: string; userId: string; familyId: string }): Promise<void> {
    this.assertUuid(params.notificationId, 'notificationId');
    this.assertUuid(params.userId, 'userId');
    this.assertUuid(params.familyId, 'familyId');

    const [notif] = await this.db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        familyId: notifications.familyId,
        isRead: notifications.isRead,
      })
      .from(notifications)
      .where(eq(notifications.id, params.notificationId));

    if (!notif) {
      throw new NotFoundError('Notification not found');
    }

    if (notif.userId !== params.userId) {
      throw new ForbiddenError('Notification does not belong to user');
    }

    if (notif.familyId !== params.familyId) {
      throw new ForbiddenError('Notification does not belong to family');
    }

    if (notif.isRead) return;

    await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(
        eq(notifications.id, params.notificationId),
        eq(notifications.isRead, false)
      ));
  }

  /**
   * Mark all unread notifications as read within a family (idempotent).
   * Returns number of notifications updated.
   */
  async markAllAsRead(params: { userId: string; familyId: string }): Promise<number> {
    this.assertUuid(params.userId, 'userId');
    this.assertUuid(params.familyId, 'familyId');

    const updated = await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(
        eq(notifications.userId, params.userId),
        eq(notifications.familyId, params.familyId),
        eq(notifications.isRead, false)
      ))
      .returning({ id: notifications.id });

    return updated.length;
  }

  /**
   * Scheduled notifications (minimal primitives for a future scheduler/worker).
   */
  async schedule(params: {
    familyId: string;
    type: NotificationTypeId;
    refId: string;
    scheduledAt: Date;
  }): Promise<void> {
    this.assertUuid(params.familyId, 'familyId');
    this.assertUuid(params.refId, 'refId');
    await this.assertFamilyExists(params.familyId);

    await this.db.insert(scheduledNotifications).values({
      familyId: params.familyId,
      type: params.type,
      refId: params.refId,
      scheduledAt: params.scheduledAt,
      status: 'PENDING',
    });
  }

  async listDue(params: { now?: Date; limit: number }): Promise<Array<{
    id: string;
    familyId: string;
    type: NotificationTypeId;
    refId: string;
    scheduledAt: Date;
    status: ScheduleStatus;
  }>> {
    const now = params.now ?? new Date();
    const limit = Math.min(Math.max(params.limit, 1), 500);

    return await this.db
      .select({
        id: scheduledNotifications.id,
        familyId: scheduledNotifications.familyId,
        type: scheduledNotifications.type,
        refId: scheduledNotifications.refId,
        scheduledAt: scheduledNotifications.scheduledAt,
        status: scheduledNotifications.status,
      })
      .from(scheduledNotifications)
      .where(and(
        eq(scheduledNotifications.status, 'PENDING'),
        lte(scheduledNotifications.scheduledAt, now)
      ))
      .orderBy(asc(scheduledNotifications.scheduledAt))
      .limit(limit);
  }

  async markScheduledDone(id: string): Promise<void> {
    this.assertUuid(id, 'scheduledNotificationId');
    await this.db
      .update(scheduledNotifications)
      .set({ status: 'DONE' })
      .where(eq(scheduledNotifications.id, id));
  }
}
