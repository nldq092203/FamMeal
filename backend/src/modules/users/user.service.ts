import { eq, count, ilike, asc, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '@/db/index.js';
import { users, User } from '@/db/schema/user.table';
import { NotFoundError, ConflictError } from '@/shared/errors.js';
import { UpdateUserInput, ListUsersQuery } from '@/modules/users/user.schema';
import { cacheGetJson, cacheSetJson } from '@/shared/cache/index.js';
import { logger } from '@/shared/logger.js';

type PublicUser = Omit<User, 'password'>;

const SALT_ROUNDS = 10;

const publicUserSelect = {
  id: users.id,
  email: users.email,
  username: users.username,
  name: users.name,
  avatarId: users.avatarId,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  deletedAt: users.deletedAt,
};

/**
 * User service - handles all user business logic
 */
export class UserService {
  /**
   * Get all users with pagination
   */
  async getUsers(query: ListUsersQuery): Promise<{ users: PublicUser[]; total: number }> {
    const offset = (query.page - 1) * query.pageSize;

    const [usersResult, totalResult] = await Promise.all([
      db.select(publicUserSelect).from(users).limit(query.pageSize).offset(offset),
      db.select({ count: count() }).from(users),
    ]);

    return {
      users: usersResult,
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<PublicUser> {
    const [user] = await db.select(publicUserSelect).from(users).where(eq(users.id, id));

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return user;
  }

  private suggestCacheKey(q: string, limit: number): string {
    return `users:suggest:v1:q=${q.toLowerCase()}:limit=${limit}`;
  }

  /**
   * Suggest users (username/name prefix) for typeahead/autocomplete
   */
  async suggestUsers(
    q: string,
    limit: number
  ): Promise<Array<{ id: string; username: string; displayName: string; avatarId: string }>> {
    const query = q.trim();
    if (!query) return [];

    const cacheKey = this.suggestCacheKey(query, limit);
    const cached = await cacheGetJson<Array<{ id: string; username: string; displayName: string; avatarId: string }>>(cacheKey);
    if (cached) {
      logger.debug({ q: query, limit, cache: 'hit', resultCount: cached.length }, 'suggestUsers');
      return cached;
    }

    const results = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatarId: users.avatarId,
      })
      .from(users)
      .where(or(
        ilike(users.username, `${query}%`),
        ilike(users.name, `${query}%`),
        ilike(users.email, `${query}%`)
      ))
      .orderBy(asc(users.username))
      .limit(limit);

    logger.debug({ q: query, limit, cache: 'miss', resultCount: results.length }, 'suggestUsers db query');

    const mapped = results.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.name,
      avatarId: u.avatarId,
    }));

    await cacheSetJson(cacheKey, mapped, 30);
    return mapped;
  }

  /**
   * Update user by ID
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<PublicUser> {
    // Check if user exists
    await this.getUserById(id);

    // If email is being updated, check for conflicts
    if (data.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email));

      if (existingUser && existingUser.id !== id) {
        throw new ConflictError(`User with email ${data.email} already exists`);
      }
    }

    // If username is being updated, check for conflicts
    if (data.username) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, data.username));

      if (existingUser && existingUser.id !== id) {
        throw new ConflictError(`Username ${data.username} is already taken`);
      }
    }

    const { password: plainPassword, ...rest } = data;
    const password = plainPassword
      ? await bcrypt.hash(plainPassword, SALT_ROUNDS)
      : undefined;

    const [updatedUser] = await db
      .update(users)
      .set({
        ...rest,
        ...(password ? { password } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning(publicUserSelect);

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id: string): Promise<void> {
    // Check if user exists
    await this.getUserById(id);

    await db.delete(users).where(eq(users.id, id));
  }
}
