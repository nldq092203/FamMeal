import { z } from 'zod';

/**
 * Schema for casting a vote (rank)
 */
export const createVoteSchema = z.object({
  rankPosition: z.number().int().min(1).max(10), // Rank 1 to 10
});

/**
 * Schema for bulk voting - submit all rankings at once
 */
export const bulkVoteSchema = z.object({
  votes: z.array(
    z.object({
      proposalId: z.string().uuid(),
      rankPosition: z.number().int().min(1).max(10),
    })
  ).min(1), // At least one vote required
});

/**
 * Types inferred from schemas
 */
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type BulkVoteInput = z.infer<typeof bulkVoteSchema>;
