import { pgTable, uuid, smallint, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { desc, eq } from 'drizzle-orm';
import { users } from './user.table';
import { families } from './family.table';
import type { NotificationTypeId } from '@/shared/notifications.js';

/**
 * Notifications — user-scoped, read/unread
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }),

    type: smallint('type').notNull().$type<NotificationTypeId>(),

    // Reference to the related entity (proposal, meal, member, etc.)
    refId: uuid('ref_id'),

    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('notifications_user_family_type_ref_unique').on(
      table.userId,
      table.familyId,
      table.type,
      table.refId
    ),
    index('notifications_user_family_created_idx').on(
      table.userId,
      table.familyId,
      desc(table.createdAt)
    ),
    index('notifications_user_family_unread_idx')
      .on(table.userId, table.familyId)
      .where(eq(table.isRead, false)),
  ]
);

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
