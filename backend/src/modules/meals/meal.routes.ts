import { FastifyInstance } from 'fastify';
import { MealController } from './meal.controller';
import { createMealSchema, updateMealSchema, listMealsQuerySchema } from './meal.schema';
import { MealHistoryController } from './meal-history.controller';
import { VoteController } from '../votes/vote.controller';
import { bulkVoteSchema } from '../votes/vote.schema';
import { z } from 'zod';

export async function mealRoutes(app: FastifyInstance) {
  const controller = new MealController();
  const historyController = new MealHistoryController();
  const voteController = new VoteController();
  const idParamSchema = z.object({ id: z.string().uuid() });

  // Create new meal
  app.post(
    '/',
    {
      preValidation: async (request) => {
        request.body = createMealSchema.parse(request.body);
      },
    },
    controller.createMeal.bind(controller)
  );

  // List meals
  app.get(
    '/',
    {
      preValidation: async (request) => {
        request.query = listMealsQuerySchema.parse(request.query);
      },
    },
    controller.listMeals.bind(controller)
  );

  // Get meal details
  app.get(
    '/:id',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
      },
    },
    controller.getMeal.bind(controller)
  );

  // Get meal summary (proposals + votes + decision)
  app.get(
    '/:id/summary',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
      },
    },
    historyController.getMealSummary.bind(historyController)
  );

  // Submit all votes for a meal at once (bulk voting)
  app.post(
    '/:id/votes/bulk',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
        request.body = bulkVoteSchema.parse(request.body);
      },
    },
    voteController.bulkCastVotes.bind(voteController)
  );

  // Get current user's votes for a meal
  app.get(
    '/:id/votes/my-votes',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
      },
    },
    voteController.getUserVotesForMeal.bind(voteController)
  );

  // Update meal
  app.patch(
    '/:id',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
        request.body = updateMealSchema.parse(request.body);
      },
    },
    controller.updateMeal.bind(controller)
  );

  // Delete meal
  app.delete(
    '/:id',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
      },
    },
    controller.deleteMeal.bind(controller)
  );
}
