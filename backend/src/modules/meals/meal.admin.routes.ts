import { FastifyInstance } from 'fastify';
import { MealAdminController } from './meal.admin.controller';
import { finalizeMealSchema } from './meal.admin.schema';
import { createMealSchema, updateMealSchema } from './meal.schema';
import { z } from 'zod';

/**
 * Admin-only meal routes
 * Note: Actual role check is done in the service layer per meal
 */
export async function mealAdminRoutes(app: FastifyInstance) {
  const controller = new MealAdminController();
  const idParamSchema = z.object({ id: z.string().uuid() });

  // POST /admin/meals - Create new meal (admin-only)
  app.post('/', {
    preValidation: async (request) => {
      request.body = createMealSchema.parse(request.body);
    },
  }, controller.createMeal.bind(controller));

  // PATCH /admin/meals/:id - Update meal (admin-only)
  app.patch('/:id', {
    preValidation: async (request) => {
      request.params = idParamSchema.parse(request.params);
      request.body = updateMealSchema.parse(request.body);
    },
  }, controller.updateMeal.bind(controller));

  // DELETE /admin/meals/:id - Delete meal (admin-only)
  app.delete('/:id', {
    preValidation: async (request) => {
      request.params = idParamSchema.parse(request.params);
    },
  }, controller.deleteMeal.bind(controller));

  // POST /admin/meals/:id/close-voting
  app.post('/:id/close-voting', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, controller.closeVoting.bind(controller));

  // POST /admin/meals/:id/reopen-voting
  app.post('/:id/reopen-voting', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, controller.reopenVoting.bind(controller));

  // POST /admin/meals/:id/finalize
  app.post('/:id/finalize', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    preValidation: async (request) => {
      request.body = finalizeMealSchema.parse(request.body);
    },
  }, controller.finalizeMeal.bind(controller));
}
