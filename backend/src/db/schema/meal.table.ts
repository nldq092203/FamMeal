import {
  pgTable,
  uuid,
  date,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { families } from './family.table';
import { mealStatusEnum, mealTypeEnum } from './enums';

/**
 * Meals table — MVP, clean & extensible
 */
export const meals = pgTable(
  'meals',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),

    // Meal identity
    scheduledFor: date('scheduled_for').notNull(),
    mealType: mealTypeEnum('meal_type')
      .notNull()
      .default('DINNER'),

    // Workflow
    status: mealStatusEnum('status')
      .notNull()
      .default('PLANNING'),

    // Constraints defined by admin (before proposals)
    constraints: jsonb('constraints').$type<{
      maxBudget?: number;
      maxPrepTimeMinutes?: number;
      dietaryRestrictions?: string[];
      servings?: number;
    }>(),

    // Final decision (single source of truth)
    finalDecision: jsonb('final_decision').$type<{
      selectedProposalId: string;
      decidedByUserId: string;
      reason?: string;
    }>(),

    // Workflow timestamps
    votingClosedAt: timestamp('voting_closed_at'),
    finalizedAt: timestamp('finalized_at'),

    // Audit
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // Soft delete
  },
  (table) => [
    // Fast lookup per family + day
    index('meals_family_date_idx').on(
      table.familyId,
      table.scheduledFor
    ),
    index('meals_status_idx').on(table.status),
  ]
);

export type Meal = InferSelectModel<typeof meals>;
export type NewMeal = InferInsertModel<typeof meals>;
