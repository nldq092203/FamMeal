import { FastifyRequest, FastifyReply } from 'fastify';
import { MealService } from './meal.service';
import { CreateMealInput, UpdateMealInput, ListMealsQuery } from './meal.schema';
import { UnauthorizedError } from '@/shared/errors.js';

export class MealController {
  private mealService: MealService;

  constructor() {
    this.mealService = new MealService();
  }

  /**
   * POST /meals - Create new meal
   */
  async createMeal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = request.body as CreateMealInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const meal = await this.mealService.createMeal(user.userId, body);

    return reply.status(201).send({
      success: true,
      data: meal,
    });
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

  /**
   * PATCH /meals/:id - Update meal
   */
  async updateMeal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateMealInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const meal = await this.mealService.updateMeal(id, user.userId, body);

    return reply.send({
      success: true,
      data: meal,
    });
  }

  /**
   * DELETE /meals/:id - Delete meal
   */
  async deleteMeal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    await this.mealService.deleteMeal(id, user.userId);

    return reply.status(204).send();
  }
}
