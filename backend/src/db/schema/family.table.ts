import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { familyAvatarEnum } from './enums';

/**
 * Families table schema
 */
export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarId: familyAvatarEnum('avatar_id').notNull().default('panda'),
  settings: jsonb('settings').$type<{
    defaultCuisinePreferences?: string[];
    defaultDietaryRestrictions?: string[];
    defaultMaxBudget?: number;
    defaultMaxPrepTime?: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Type for selecting a family (querying from database)
 */
export type Family = InferSelectModel<typeof families>;

/**
 * Type for inserting a family (creating new record)
 */
export type NewFamily = InferInsertModel<typeof families>;
