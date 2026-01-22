import { FastifyInstance } from 'fastify';
import { FamilyController } from './family.controller';
import { createFamilySchema } from './family.schema';
import { MealHistoryController } from '@/modules/meals/meal-history.controller';

/**
 * Public family routes (member-level access)
 */
export async function familyRoutes(app: FastifyInstance) {
  const controller = new FamilyController();
  const historyController = new MealHistoryController();

  // POST / - Create family (creator becomes admin)
  app.post('/', {
    preHandler: async (request) => {
      request.body = createFamilySchema.parse(request.body);
    }
  }, controller.createFamily.bind(controller));

  // GET / - List user's families
  app.get('/', controller.getMyFamilies.bind(controller));

  // GET /:id - Get family details
  app.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, controller.getFamily.bind(controller));

  // GET /:id/history - Get family meal history
  app.get('/:id/history', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string' },
          offset: { type: 'string' },
        },
      },
    },
  }, historyController.getFamilyHistory.bind(historyController));
}
