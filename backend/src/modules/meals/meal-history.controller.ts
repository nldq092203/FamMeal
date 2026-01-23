import { FastifyRequest, FastifyReply } from 'fastify';
import { MealHistoryService } from './meal-history.service';
import { UnauthorizedError } from '@/shared/errors.js';

export class MealHistoryController {
  private historyService: MealHistoryService;

  constructor() {
    this.historyService = new MealHistoryService();
  }

  /**
   * GET /families/:id/history - Get family meal history
   */
  async getFamilyHistory(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const query = request.query as { limit?: string; offset?: string };
    const user = request.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const offset = query.offset ? parseInt(query.offset, 10) : undefined;

    const history = await this.historyService.getFamilyHistory(id, user.userId, {
      limit,
      offset,
    });

    return reply.send({
      success: true,
      data: history,
    });
  }

  /**
   * GET /meals/:id/summary - Get comprehensive meal summary
   */
  async getMealSummary(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const summary = await this.historyService.getMealSummary(id, user.userId);

    return reply.send({
      success: true,
      data: summary,
    });
  }
}
