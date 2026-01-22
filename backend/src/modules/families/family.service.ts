import { eq, and, inArray, asc } from 'drizzle-orm';
import { db } from '@/db';
import { families, Family } from '@/db/schema/family.table';
import { familyMembers, FamilyMember } from '@/db/schema/family-member.table';
import { users } from '@/db/schema/user.table';
import { CreateFamilyInput, UpdateFamilyInput, AddFamilyMemberInput, UpdateFamilyProfileInput, UpdateFamilySettingsInput } from './family.schema';
import { NotFoundError, ForbiddenError, ConflictError } from '@/shared/errors';
import { cacheDel, cacheWrapJson } from '@/shared/cache/index.js';

type FamilyDetailsMember = {
  userId: string;
  username: string;
  name: string;
  avatarId: string;
  role: string;
  joinedAt: string;
};

type FamilyDetailsCached = Family & { members: FamilyDetailsMember[] };

export class FamilyService {
  private familyDetailsCacheKey(familyId: string): string {
    return `family:${familyId}:details:v1`;
  }

  /**
   * Create a new family and add the creator as admin
   */
  async createFamily(userId: string, data: CreateFamilyInput): Promise<Family> {
    const family = await db.transaction(async (tx) => {
      // 1. Create the family
      const [newFamily] = await tx
        .insert(families)
        .values({
          name: data.name,
          avatarId: data.avatarId ?? 'panda',
          settings: data.settings || {},
        })
        .returning();

      if (!newFamily) {
        throw new Error('Failed to create family');
      }

      // 2. Add creator as ADMIN
      await tx.insert(familyMembers).values({
        familyId: newFamily.id,
        userId: userId,
        role: 'ADMIN',
      });

      // 3. Optionally add initial members by username
      if (data.members?.length) {
        const uniqueMembersByUsername = new Map<string, { role: 'ADMIN' | 'MEMBER' }>();
        for (const member of data.members) {
          uniqueMembersByUsername.set(member.username, { role: member.role ?? 'MEMBER' });
        }

        const usernamesToAdd = Array.from(uniqueMembersByUsername.keys());
        const usersToAdd = await tx
          .select({ id: users.id, username: users.username })
          .from(users)
          .where(inArray(users.username, usernamesToAdd));

        const userIdByUsername = new Map(usersToAdd.map((u) => [u.username, u.id]));
        const missingUsernames = usernamesToAdd.filter((username) => !userIdByUsername.has(username));
        if (missingUsernames.length) {
          throw new NotFoundError(`Users not found: ${missingUsernames.join(', ')}`);
        }

        const memberRows = usernamesToAdd
          .map((username) => ({
            familyId: newFamily.id,
            userId: userIdByUsername.get(username)!,
            role: uniqueMembersByUsername.get(username)!.role,
          }))
          .filter((row) => row.userId !== userId);

        if (memberRows.length) {
          await tx.insert(familyMembers).values(memberRows);
        }
      }

      return newFamily;
    });

    await cacheDel(this.familyDetailsCacheKey(family.id));
    return family;
  }

  /**
   * Get family by ID (with authorization check)
   */
  async getFamilyById(
    id: string,
    userId: string
  ): Promise<
    Family & {
      myRole: string;
      members: FamilyDetailsMember[];
    }
  > {
    // Check if user is a member of the family
    const [membership] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, id),
        eq(familyMembers.userId, userId)
      ));

    if (!membership) {
      throw new NotFoundError(`Family not found or you are not a member`);
    }

    const cachedFamily = await cacheWrapJson<FamilyDetailsCached>(this.familyDetailsCacheKey(id), async () => {
      const [family, members] = await Promise.all([
        db.select().from(families).where(eq(families.id, id)).then((rows) => rows[0]),
        db
          .select({
            userId: users.id,
            username: users.username,
            name: users.name,
            avatarId: users.avatarId,
            role: familyMembers.role,
            joinedAt: familyMembers.joinedAt,
          })
          .from(familyMembers)
          .innerJoin(users, eq(familyMembers.userId, users.id))
          .where(eq(familyMembers.familyId, id))
          .orderBy(asc(users.username)),
      ]);

      if (!family) throw new NotFoundError('Family not found');
      return {
        ...family,
        members: members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        })),
      };
    });

    return { ...cachedFamily, myRole: membership.role };
  }

  /**
   * Get all families for a user
   */
  async getUserFamilies(userId: string): Promise<Array<Family & { role: string }>> {
    const results = await db
      .select({
        family: families,
        role: familyMembers.role,
      })
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, userId));

    return results.map((r) => ({
      ...r.family,
      role: r.role,
    }));
  }

  /**
   * Update family settings
   */
  async updateFamily(id: string, userId: string, data: UpdateFamilyInput): Promise<Family> {
    // Check if user is ADMIN
    await this.checkFamilyRole(id, userId, ['ADMIN']);

    const [updatedFamily] = await db
      .update(families)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(families.id, id))
      .returning();

    if (!updatedFamily) {
      throw new NotFoundError('Family not found');
    }

    await cacheDel(this.familyDetailsCacheKey(id));
    return updatedFamily;
  }

  /**
   * Update family profile (name + avatar only)
   */
  async updateFamilyProfile(id: string, userId: string, data: UpdateFamilyProfileInput): Promise<Family> {
    return await this.updateFamily(id, userId, data);
  }

  /**
   * Update family settings only
   */
  async updateFamilySettings(id: string, userId: string, data: UpdateFamilySettingsInput): Promise<Family> {
    return await this.updateFamily(id, userId, data);
  }

  /**
   * Add member to family (by email or username)
   */
  async addMember(familyId: string, currentUserId: string, data: AddFamilyMemberInput): Promise<FamilyMember> {
    // Check permissions
    await this.checkFamilyRole(familyId, currentUserId, ['ADMIN']);

    // Find user by username/email
    const [userToAdd] = await db
      .select()
      .from(users)
      .where(
        data.username
          ? eq(users.username, data.username)
          : eq(users.email, data.email!)
      );

    if (!userToAdd) {
      const identifier = data.username ? `username ${data.username}` : `email ${data.email}`;
      throw new NotFoundError(`User with ${identifier} not found`);
    }

    // Check if already a member
    const [existingMember] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userToAdd.id)
      ));

    if (existingMember) {
      throw new ConflictError('User is already a member of this family');
    }

    // Add member
    const [newMember] = await db
      .insert(familyMembers)
      .values({
        familyId,
        userId: userToAdd.id,
        role: data.role || 'MEMBER',
      })
      .returning();

    if (!newMember) {
      throw new Error('Failed to add member');
    }

    await cacheDel(this.familyDetailsCacheKey(familyId));
    return {
      ...newMember,
      avatarId: userToAdd.avatarId,
    } as unknown as FamilyMember;
  }

  /**
   * Remove member from family
   */
  async removeMember(familyId: string, currentUserId: string, memberIdToRemove: string): Promise<void> {
    // Validation:
    // 1. Admins can remove anyone
    // 2. Members can remove themselves (leave family)
    
    const [currentUserMembership] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, currentUserId)
      ));
      
    if (!currentUserMembership) {
      throw new ForbiddenError('You are not a member of this family');
    }

    const isSelfRemoval = currentUserId === memberIdToRemove;
    const isAdmin = currentUserMembership.role === 'ADMIN';

    if (!isSelfRemoval && !isAdmin) {
      throw new ForbiddenError('Only admins can remove other members');
    }

    // Cannot remove the last admin? (Optional business rule to implement later)

    await db
      .delete(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, memberIdToRemove)
      ));

    await cacheDel(this.familyDetailsCacheKey(familyId));
  }

  /**
   * Helper: Check if user has required role in family
   */
  private async checkFamilyRole(familyId: string, userId: string, allowedRoles: string[]): Promise<void> {
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

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
    }
  }
}
