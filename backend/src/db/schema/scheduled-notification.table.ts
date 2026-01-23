import { pgTable, uuid, smallint, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { families } from './family.table';
import type { NotificationTypeId, ScheduleStatus } from '@/shared/notifications.js';

/**
 * Scheduled notifications — planned events (e.g. reminders)
 */
export const scheduledNotifications = pgTable(
  'scheduled_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    type: smallint('type').notNull().$type<NotificationTypeId>(),

    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),

    refId: uuid('ref_id').notNull(),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),

    status: varchar('status', { length: 20 })
      .notNull()
      .default('PENDING')
      .$type<ScheduleStatus>(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('scheduled_notifications_status_scheduled_idx').on(
      table.status,
      table.scheduledAt
    ),
  ]
);

export type ScheduledNotification = InferSelectModel<typeof scheduledNotifications>;
export type NewScheduledNotification = InferInsertModel<typeof scheduledNotifications>;
