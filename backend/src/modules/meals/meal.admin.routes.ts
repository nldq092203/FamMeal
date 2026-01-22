import { FastifyInstance } from 'fastify';
import { MealAdminController } from './meal.admin.controller';
import { finalizeMealSchema } from './meal.admin.schema';

/**
 * Admin-only meal routes
 * Note: Actual role check is done in the service layer per meal
 */
export async function mealAdminRoutes(app: FastifyInstance) {
  const controller = new MealAdminController();

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
