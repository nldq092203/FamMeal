import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { families } from './family.table';
import { users } from './user.table';
import { familyRoleEnum } from './enums';

/**
 * Family members junction table
 * Links users to families with roles
 */
export const familyMembers = pgTable(
  'family_members',
  {
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: familyRoleEnum('role').notNull().default('MEMBER'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.familyId, table.userId] }),
    index('family_members_family_idx').on(table.familyId),
    index('family_members_user_idx').on(table.userId),
  ]
);

/**
 * Type for selecting a family member (querying from database)
 */
export type FamilyMember = InferSelectModel<typeof familyMembers>;

/**
 * Type for inserting a family member (creating new record)
 */
export type NewFamilyMember = InferInsertModel<typeof familyMembers>;
