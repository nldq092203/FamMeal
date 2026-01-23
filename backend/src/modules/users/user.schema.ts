import { z } from 'zod';
import { userAvatarEnum } from '@/db/schema/enums';

const userAvatarSchema = z.enum(userAvatarEnum.enumValues);

/**
 * Schema for user update
 */
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100, 'Username is too long').optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  avatarId: userAvatarSchema.optional(),
});

/**
 * Schema for user ID parameter
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

/**
 * Schema for user query/listing
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Schema for suggestion typeahead (q=prefix)
 */
export const suggestUsersQuerySchema = z.object({
  q: z.string().min(1, 'q is required').max(100),
  limit: z.coerce.number().min(1).max(50).default(8),
});

/**
 * Inferred types from schemas
 */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type SuggestUsersQuery = z.infer<typeof suggestUsersQuerySchema>;
