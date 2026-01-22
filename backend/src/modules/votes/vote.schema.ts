import { z } from 'zod';

/**
 * Schema for casting a vote (rank)
 */
export const createVoteSchema = z.object({
  rankPosition: z.number().int().min(1).max(10), // Rank 1 to 10
});

/**
 * Types inferred from schemas
 */
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
