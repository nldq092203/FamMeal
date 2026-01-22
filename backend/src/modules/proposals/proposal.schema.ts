import { z } from 'zod';

/**
 * Extra metadata schema - simplified for MVP
 */
const extraSchema = z.object({
  imageUrls: z.array(z.string().url()),
});

/**
 * Schema for creating a proposal
 */
export const createProposalSchema = z.object({
  dishName: z.string().min(1, 'Dish name is required').max(255),
  ingredients: z.string().optional(),
  notes: z.string().optional(),
  extra: extraSchema.optional(),
});

/**
 * Schema for updating a proposal
 */
export const updateProposalSchema = z.object({
  dishName: z.string().min(1).max(255).optional(),
  ingredients: z.string().optional(),
  notes: z.string().optional(),
  extra: extraSchema.optional(),
});

/**
 * Types inferred from schemas
 */
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
