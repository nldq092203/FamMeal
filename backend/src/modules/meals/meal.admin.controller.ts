import { FastifyRequest, FastifyReply } from 'fastify';
import { MealAdminService } from './meal.admin.service';
import { FinalizeMealInput } from './meal.admin.schema';
import { UnauthorizedError } from '@/shared/errors.js';

export class MealAdminController {
  private mealAdminService: MealAdminService;

  constructor() {
    this.mealAdminService = new MealAdminService();
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
