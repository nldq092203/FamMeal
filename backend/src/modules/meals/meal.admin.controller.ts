import { FastifyRequest, FastifyReply } from 'fastify';
import { MealAdminService } from './meal.admin.service';
import { FinalizeMealInput } from './meal.admin.schema';
import { UnauthorizedError } from '@/shared/errors.js';
import { MealService } from './meal.service';
import { CreateMealInput, UpdateMealInput } from './meal.schema';

export class MealAdminController {
  private mealAdminService: MealAdminService;
  private mealService: MealService;

  constructor() {
    this.mealAdminService = new MealAdminService();
    this.mealService = new MealService();
  }

  /**
   * POST /admin/meals - Create new meal (admin-only)
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
   * PATCH /admin/meals/:id - Update meal (admin-only)
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
   * DELETE /admin/meals/:id - Delete meal (admin-only)
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

  /**
   * POST /admin/meals/:id/close-voting - Close voting for meal
   */
  async closeVoting(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const meal = await this.mealAdminService.closeVoting(id, user.userId);

    return reply.send({
      success: true,
      data: meal,
    });
  }

  /**
   * POST /admin/meals/:id/reopen-voting - Reopen voting
   */
  async reopenVoting(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const meal = await this.mealAdminService.reopenVoting(id, user.userId);

    return reply.send({
      success: true,
      data: meal,
    });
  }

  /**
   * POST /admin/meals/:id/finalize - Finalize meal with decision
   */
  async finalizeMeal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as FinalizeMealInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const meal = await this.mealAdminService.finalizeMeal(id, user.userId, body);

    return reply.send({
      success: true,
      data: meal,
    });
  }
}
