import { FastifyPluginAsync, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '@/shared/errors.js';

/**
 * Zod validation plugin
 * Integrates Zod with Fastify for request validation
 */
export const zodPlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * Custom error handler for Zod validation errors
   */
  fastify.setErrorHandler((error, _request, reply) => {
    // Handle application errors (expected failures)
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

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

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

    // Handle other errors with proper typing
    const fastifyError = error as FastifyError;
    const statusCode = fastifyError.statusCode ?? 500;
    fastify.log.error(error);

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
};
