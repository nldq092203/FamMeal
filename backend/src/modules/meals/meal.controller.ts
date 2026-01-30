import { FastifyRequest, FastifyReply } from 'fastify';
import { MealService } from './meal.service';
import { ListMealsQuery } from './meal.schema';
import { UnauthorizedError } from '@/shared/errors.js';

export class MealController {
  private mealService: MealService;

  constructor() {
    this.mealService = new MealService();
  }



  /**
   * GET /meals - List meals
   */
  async listMeals(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const query = request.query as ListMealsQuery;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const meals = await this.mealService.listMeals(user.userId, query);

    return reply.send({
      success: true,
      data: meals,
    });
  }

  /**
   * GET /meals/:id - Get meal details
   */
  async getMeal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const meal = await this.mealService.getMealById(id, user.userId);

    return reply.send({
      success: true,
      data: meal,
    });
  }
}

