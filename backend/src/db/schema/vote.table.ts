import { pgTable, uuid, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { proposals } from './proposal.table';
import { users } from './user.table';

/**
 * Votes table schema
 * Ranked voting system for proposals
 */
export const votes = pgTable(
  'votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    // Rank position: 1 = top choice, 2 = second choice, etc.
    rankPosition: integer('rank_position').notNull(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('votes_proposal_idx').on(table.proposalId),
    index('votes_user_idx').on(table.userId),
    // Ensure one user can only give one rank position to one proposal
    unique('votes_user_proposal_rank_unique').on(
      table.userId,
      table.proposalId,
      table.rankPosition
    ),
  ]
);

/**
 * Type for selecting a vote (querying from database)
 */
export type Vote = InferSelectModel<typeof votes>;

/**
 * Type for inserting a vote (creating new record)
 */
export type NewVote = InferInsertModel<typeof votes>;
