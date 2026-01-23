import type { FamilyRole } from '@/types'

/**
 * Permission actions that can be performed in the app
 */
export type PermissionAction =
  // Family management
  | 'edit_family_info'
  | 'delete_family'
  | 'invite_members'
  | 'remove_members'
  | 'update_family_preferences'
  
  // Meal management
  | 'finalize_meal'
  | 'delete_proposal'
  | 'override_voting'
  
  // General
  | 'view_family'
  | 'create_proposal'
  | 'vote_on_meal'

/**
 * Permission definitions for each role
 */
const ROLE_PERMISSIONS: Record<FamilyRole, PermissionAction[]> = {
  ADMIN: [
    // Admins can do everything
    'edit_family_info',
    'delete_family',
    'invite_members',
    'remove_members',
    'update_family_preferences',
    'finalize_meal',
    'delete_proposal',
    'override_voting',
    'view_family',
    'create_proposal',
    'vote_on_meal',
  ],
  MEMBER: [
    // Members can view and participate, but not manage
    'view_family',
    'create_proposal',
    'vote_on_meal',
  ],
}

/**
 * Check if a user with given role can perform an action
 */
export function canUserPerformAction(
  role: FamilyRole | null | undefined,
  action: PermissionAction
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false
}

/**
 * Check if user is an admin
 */
export function isAdmin(role: FamilyRole | null | undefined): boolean {
  return role === 'ADMIN'
}

/**
 * Check if user is a member (not admin)
 */
export function isMember(role: FamilyRole | null | undefined): boolean {
  return role === 'MEMBER'
}

/**
 * Check if user has any role
 */
export function hasRole(role: FamilyRole | null | undefined): boolean {
  return role === 'ADMIN' || role === 'MEMBER'
}
