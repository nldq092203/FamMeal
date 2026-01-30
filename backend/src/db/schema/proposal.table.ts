import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { meals } from './meal.table';
import { users } from './user.table';

/**
 * Proposals table schema
 * Meal ideas/suggestions submitted by family members
 */
export const proposals = pgTable(
  'proposals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mealId: uuid('meal_id')
      .notNull()
      .references(() => meals.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    // Core content
    dishName: varchar('dish_name', { length: 255 }).notNull(),
    ingredients: text('ingredients'),
    notes: text('notes'),
    
    // Extra metadata
    extra: jsonb('extra').$type<{
      imageUrls: string[];
      restaurant?: {
        name: string;
        addressUrl: string;
      };
    }>(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('proposals_meal_idx').on(table.mealId),
    index('proposals_user_idx').on(table.userId),
    index('proposals_meal_user_idx').on(table.mealId, table.userId),
  ]
);

/**
 * Type for selecting a proposal (querying from database)
 */
export type Proposal = InferSelectModel<typeof proposals>;

/**
 * Type for inserting a proposal (creating new record)
 */
export type NewProposal = InferInsertModel<typeof proposals>;
