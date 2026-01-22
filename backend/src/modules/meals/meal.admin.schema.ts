import { z } from 'zod';

export const finalizeMealSchema = z.object({
  selectedProposalId: z.string().uuid(),
  reason: z.string().optional(),
});

export type FinalizeMealInput = z.infer<typeof finalizeMealSchema>;
