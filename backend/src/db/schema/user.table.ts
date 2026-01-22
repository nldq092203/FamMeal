import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { userAvatarEnum } from './enums';

/**
 * Users table schema
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // Hashed password
  username: varchar('username', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarId: userAvatarEnum('avatar_id').notNull().default('panda'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Type for selecting a user (querying from database)
 */
export type User = InferSelectModel<typeof users>;

/**
 * Type for inserting a user (creating new record)
 */
export type NewUser = InferInsertModel<typeof users>;
