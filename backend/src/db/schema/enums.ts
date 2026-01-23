import { pgEnum } from 'drizzle-orm/pg-core';

export const avatarIds = [
  'panda',
  'raccoon',
  'cat',
  'dog',
  'rabbit',
  'bear',
  'elephant',
  'fox',
  'giraffe',
  'koala',
  'penguin',
  'frog',
  'monkey',
] as const;

export type AvatarId = (typeof avatarIds)[number];

/**
 * Family member role enum
 */
export const familyRoleEnum = pgEnum('family_role', ['ADMIN', 'MEMBER']);

/**
 * Meal status enum
 */
export const mealStatusEnum = pgEnum('meal_status', [
  'PLANNING',
  'LOCKED',
  'COMPLETED',
]);

/**
 * Meal type enum
 */
export const mealTypeEnum = pgEnum('meal_type', [
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK',
  'BRUNCH',
  'OTHER',
]);

/**
 * User avatar enum
 */
export const userAvatarEnum = pgEnum('user_avatar', [...avatarIds]);

/**
 * Family avatar enum
 */
export const familyAvatarEnum = pgEnum('family_avatar', [...avatarIds]);
