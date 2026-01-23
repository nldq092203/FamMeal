import { z } from 'zod';

const uuidArray = z
  .array(z.string().uuid())
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate proposalIds are not allowed' });

export const finalizeMealSchema = z
  .object({
    // New shape: allow selecting multiple proposals
    selectedProposalIds: uuidArray.optional(),
    // Back-compat: allow legacy single selection
    selectedProposalId: z.string().uuid().optional(),
    cookUserId: z.string().uuid().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (value) => value.selectedProposalIds?.length || value.selectedProposalId,
    {
      message: 'Either selectedProposalIds or selectedProposalId is required',
      path: ['selectedProposalId'], // Show error on this field for clarity
    }
  )
  .transform((value) => ({
    selectedProposalIds: value.selectedProposalIds ?? [value.selectedProposalId as string],
    cookUserId: value.cookUserId,
    reason: value.reason,
  }));

export type FinalizeMealInput = z.infer<typeof finalizeMealSchema>;
