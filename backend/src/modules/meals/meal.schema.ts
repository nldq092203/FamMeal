import { z } from 'zod';
import { mealStatusEnum, mealTypeEnum } from '@/db/schema/enums';

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateOnlyInput(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (dateOnlyRegex.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toISOString().slice(0, 10);
}

/**
 * Meal constraints schema
 */
const mealConstraintsSchema = z.object({
  maxBudget: z.number().positive().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  maxPrepTime: z.number().positive().optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  servings: z.number().positive().optional(),
});

const dateOnlySchema = z.preprocess(
  normalizeDateOnlyInput,
  z.string().regex(dateOnlyRegex, 'Invalid date format (YYYY-MM-DD)')
);

/**
 * Schema for creating a meal
 */
export const createMealSchema = z.object({
  familyId: z.string().uuid(),
  scheduledFor: dateOnlySchema,
  mealType: z.enum(mealTypeEnum.enumValues).optional().default('DINNER'),
  constraints: mealConstraintsSchema.optional(),
});

/**
 * Schema for updating a meal (status, constraints, etc.)
 */
export const updateMealSchema = z.object({
  scheduledFor: dateOnlySchema.optional(),
  mealType: z.enum(mealTypeEnum.enumValues).optional(),
  status: z.enum(mealStatusEnum.enumValues).optional(),
  constraints: mealConstraintsSchema.optional(),
});

/**
 * Schema for querying meals (filters)
 */
export const listMealsQuerySchema = z.object({
  familyId: z.string().uuid(),
  startDate: dateOnlySchema.optional(),
  endDate: dateOnlySchema.optional(),
  status: z.enum(mealStatusEnum.enumValues).optional(),
});

/**
 * Schema for updating meal status specifically
 */
export const updateMealStatusSchema = z.object({
  status: z.enum(mealStatusEnum.enumValues),
});

/**
 * Types inferred from schemas
 */
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type ListMealsQuery = z.infer<typeof listMealsQuerySchema>;
