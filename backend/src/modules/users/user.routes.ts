import { FastifyPluginAsync } from 'fastify';
import { UserController } from './user.controller';
import {
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
  suggestUsersQuerySchema,
} from './user.schema';

/**
 * User routes plugin
 */
export const userRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new UserController();

  /**
   * List all users
   */
  fastify.get(
    '/',
    {
      preHandler: async (request) => {
        request.query = listUsersQuerySchema.parse(request.query);
      },
    },
    controller.listUsers.bind(controller)
  );

  /**
   * Suggest users (typeahead)
   */
  fastify.get(
    '/suggest',
    {
      preHandler: async (request) => {
        request.query = suggestUsersQuerySchema.parse(request.query);
      },
    },
    controller.suggestUsers.bind(controller)
  );

  /**
   * Get user by ID
   */
  fastify.get(
    '/:id',
    {
      preHandler: async (request) => {
        request.params = userIdParamSchema.parse(request.params);
      },
    },
    controller.getUser.bind(controller)
  );

  /**
   * Update user
   */
  fastify.patch(
    '/:id',
    {
      preHandler: async (request) => {
        request.params = userIdParamSchema.parse(request.params);
        request.body = updateUserSchema.parse(request.body);
      },
    },
    controller.updateUser.bind(controller)
  );

  /**
   * Delete user
   */
  fastify.delete(
    '/:id',
    {
      preHandler: async (request) => {
        request.params = userIdParamSchema.parse(request.params);
      },
    },
    controller.deleteUser.bind(controller)
  );
};
