import Fastify, { FastifyInstance, FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from '@/config/env.js';
import { logger } from '@/shared/logger.js';
import { authMiddleware } from '@/middleware/auth.middleware.js';
import { userRoutes } from '@/modules/users/user.routes.js';
import { familyRoutes } from '@/modules/families/family.routes.js';
import { familyAdminRoutes } from '@/modules/families/family.admin.routes.js';
import { mealAdminRoutes } from '@/modules/meals/meal.admin.routes.js';
import { mealRoutes } from '@/modules/meals/meal.routes.js';
import { proposalRoutes, directProposalRoutes } from '@/modules/proposals/proposal.routes.js';
import { voteRoutes, directVoteRoutes } from '@/modules/votes/vote.routes.js';
import { authRoutes } from '@/modules/auth/auth.routes.js';
import { notificationRoutes } from '@/modules/notifications/notification.routes.js';
import { ZodError } from 'zod';
import { AppError } from '@/shared/errors.js';

function isDrizzleQueryError(err: unknown): err is { name: string; message: string; cause?: unknown } {
  return Boolean(err && typeof err === 'object' && (err as { name?: unknown }).name === 'DrizzleQueryError');
}

/**
 * Build Fastify application instance
 */
export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    loggerInstance: logger as unknown as FastifyBaseLogger,
  });

  /**
   * Register global plugins
   */
  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          message: error.message,
          code: error.code ?? 'APP_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      app.log.warn(
        {
          reqId: request.id,
          method: request.method,
          url: request.url,
          errors: formattedErrors,
        },
        'Request validation failed'
      );

      return reply.status(400).send({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (isDrizzleQueryError(error)) {
      app.log.error(
        {
          reqId: request.id,
          method: request.method,
          url: request.url,
          err: error,
          cause: error.cause,
        },
        'Database query failed'
      );

      return reply.status(500).send({
        success: false,
        error: {
          message: 'Database query failed',
          code: 'DB_QUERY_FAILED',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const fastifyError = error as { statusCode?: number; message?: string };
    const statusCode = fastifyError.statusCode ?? 500;
    app.log.error(error);

    return reply.status(statusCode).send({
      success: false,
      error: {
        message: fastifyError.message || 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * Health check endpoint
   */
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  /**
   * Register module routes
   */
  // Public routes
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Protected routes (require authentication)
  await app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', authMiddleware);

    await protectedApp.register(userRoutes, { prefix: '/api/users' });
    await protectedApp.register(familyRoutes, { prefix: '/api/families' });
    await protectedApp.register(notificationRoutes, { prefix: '/api/families' });
    await protectedApp.register(mealRoutes, { prefix: '/api/meals' });
    await protectedApp.register(proposalRoutes, { prefix: '/api/meals' });
    await protectedApp.register(directProposalRoutes, { prefix: '/api/proposals' });
    await protectedApp.register(voteRoutes, { prefix: '/api/proposals' });
    await protectedApp.register(directVoteRoutes, { prefix: '/api/votes' });

    // Admin routes (require authentication + admin role)
    await protectedApp.register(familyAdminRoutes, { prefix: '/api/admin/families' });
    await protectedApp.register(mealAdminRoutes, { prefix: '/api/admin/meals' });
  });

  /**
   * 404 handler
   */
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        message: `Route ${request.method}:${request.url} not found`,
        code: 'NOT_FOUND',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  return app;
};
