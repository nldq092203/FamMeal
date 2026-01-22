import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from './user.service';
import { UpdateUserInput, ListUsersQuery, SuggestUsersQuery } from './user.schema';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors.js';
import { enforceRateLimit } from '@/shared/rate-limit.js';

/**
 * User controller - handles HTTP requests and responses
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /users - List users
   */
  async listUsers(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const query = request.query as ListUsersQuery;
    const { users, total } = await this.userService.getUsers(query);

    const totalPages = Math.ceil(total / query.pageSize);

    return reply.send({
      success: true,
      data: users,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalPages,
        totalItems: total,
        hasNext: query.page < totalPages,
        hasPrevious: query.page > 1,
      },
    });
  }

  /**
   * GET /users/suggest - Suggest users for typeahead
   */
  async suggestUsers(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const query = request.query as SuggestUsersQuery;
    const userId = request.user?.userId;
    const rateLimitKey = `rl:users:suggest:${userId ?? request.ip}`;

    await enforceRateLimit({ key: rateLimitKey, windowSeconds: 60, max: 30 });

    const results = await this.userService.suggestUsers(query.q, query.limit);
    return reply.send({ success: true, data: results });
  }

  /**
   * GET /users/:id - Get user by ID
   */
  async getUser(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const authUser = request.user;

    if (!authUser) {
      throw new UnauthorizedError();
    }

    if (authUser.userId !== id) {
      throw new ForbiddenError('You can only access your own user');
    }

    const user = await this.userService.getUserById(id);

    return reply.send({
      success: true,
      data: user,
    });
  }

  /**
   * PATCH /users/:id - Update user
   */
  async updateUser(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateUserInput;
    const authUser = request.user;

    if (!authUser) {
      throw new UnauthorizedError();
    }

    if (authUser.userId !== id) {
      throw new ForbiddenError('You can only update your own user');
    }

    const updatedUser = await this.userService.updateUser(id, body);

    return reply.send({
      success: true,
      data: updatedUser,
    });
  }

  /**
   * DELETE /users/:id - Delete user
   */
  async deleteUser(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const authUser = request.user;

    if (!authUser) {
      throw new UnauthorizedError();
    }

    if (authUser.userId !== id) {
      throw new ForbiddenError('You can only delete your own user');
    }

    await this.userService.deleteUser(id);

    return reply.status(204).send();
  }
}
