import { z } from 'zod';
import { familyRoleEnum, familyAvatarEnum } from '@/db/schema/enums';

const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(100, 'Username is too long');

/**
 * Settings schema for family preferences
 */
const familySettingsSchema = z.object({
  defaultCuisinePreferences: z.array(z.string()).optional(),
  defaultDietaryRestrictions: z.array(z.string()).optional(),
  defaultMaxBudget: z.number().positive().optional(),
  defaultMaxPrepTime: z.number().positive().optional(),
});

/**
 * Schema for creating a family
 */
export const createFamilySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  avatarId: z.enum(familyAvatarEnum.enumValues).optional(),
  settings: familySettingsSchema.optional(),
  members: z.array(z.object({
    username: usernameSchema,
    role: z.enum(familyRoleEnum.enumValues).optional().default('MEMBER'),
  })).max(50).optional(),
});

/**
 * Schema for updating a family
 */
export const updateFamilySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarId: z.enum(familyAvatarEnum.enumValues).optional(),
  settings: familySettingsSchema.optional(),
});

/**
 * Schema for updating family profile (name + avatar)
 */
export const updateFamilyProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarId: z.enum(familyAvatarEnum.enumValues).optional(),
});

/**
 * Schema for updating family settings only
 */
export const updateFamilySettingsSchema = z.object({
  settings: familySettingsSchema,
});

/**
 * Schema for adding a family member
 */
export const addFamilyMemberSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  username: usernameSchema.optional(),
  role: z.enum(familyRoleEnum.enumValues).optional().default('MEMBER'),
}).refine((data) => Boolean(data.email || data.username), {
  message: 'Either email or username is required',
});

/**
 * Schema for updating a family member
 */
export const updateFamilyMemberSchema = z.object({
  role: z.enum(familyRoleEnum.enumValues),
});

/**
 * Types inferred from schemas
 */
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
export type UpdateFamilyProfileInput = z.infer<typeof updateFamilyProfileSchema>;
export type UpdateFamilySettingsInput = z.infer<typeof updateFamilySettingsSchema>;
export type AddFamilyMemberInput = z.infer<typeof addFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
