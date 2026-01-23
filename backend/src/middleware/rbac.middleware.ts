import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { familyMembers } from '@/db/schema/family-member.table';
import { ForbiddenError, UnauthorizedError, ValidationError } from '@/shared/errors.js';

/**
 * Check if user has required role in a family
 */
export async function checkFamilyRole(
  userId: string,
  familyId: string,
  requiredRole: 'ADMIN' | 'MEMBER' = 'MEMBER'
): Promise<void> {
  const [membership] = await db
    .select()
    .from(familyMembers)
    .where(and(
      eq(familyMembers.familyId, familyId),
      eq(familyMembers.userId, userId)
    ));

  if (!membership) {
    throw new ForbiddenError('You are not a member of this family');
  }

  if (requiredRole === 'ADMIN' && membership.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }
}

/**
 * Middleware to require family admin role
 * Expects familyId in route params
 */
export async function requireFamilyAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const user = request.user;
  
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Extract familyId from params
  const params = request.params as { familyId?: string; id?: string };
  const familyId = params.familyId || params.id;

  if (!familyId) {
    throw new ValidationError('Family ID required in route params');
  }

  await checkFamilyRole(user.userId, familyId, 'ADMIN');
}

/**
 * Middleware to require family membership (any role)
 * Expects familyId in route params
 */
export async function requireFamilyMembership(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const user = request.user;
  
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  const params = request.params as { familyId?: string; id?: string };
  const familyId = params.familyId || params.id;

  if (!familyId) {
    throw new ValidationError('Family ID required in route params');
  }

  await checkFamilyRole(user.userId, familyId, 'MEMBER');
}
