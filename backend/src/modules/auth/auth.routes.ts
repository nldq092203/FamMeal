import { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AuthController } from './auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import { authMiddleware } from '@/middleware/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  // POST /auth/register
  app.post('/register', {
    schema: {
      body: zodToJsonSchema(registerSchema, 'registerSchema'),
    },
  }, controller.register.bind(controller));

  // POST /auth/login
  app.post('/login', {
    schema: {
      body: zodToJsonSchema(loginSchema, 'loginSchema'),
    },
  }, controller.login.bind(controller));

  // POST /auth/refresh
  app.post('/refresh', {
    schema: {
      body: zodToJsonSchema(refreshTokenSchema, 'refreshTokenSchema'),
    },
  }, controller.refresh.bind(controller));

  // GET /auth/me - Protected route (requires auth middleware in app.ts)
  app.get('/me', { preHandler: authMiddleware }, controller.me.bind(controller));
}
