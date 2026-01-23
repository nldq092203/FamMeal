import { FastifyRequest, FastifyReply } from 'fastify';
import { VoteService } from './vote.service';
import { CreateVoteInput, BulkVoteInput } from './vote.schema';
import { UnauthorizedError } from '@/shared/errors.js';

export class VoteController {
  private voteService: VoteService;

  constructor() {
    this.voteService = new VoteService();
  }

  /**
   * POST /proposals/:proposalId/votes - Cast/Update vote
   */
  async castVote(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { proposalId } = request.params as { proposalId: string };
    const body = request.body as CreateVoteInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const vote = await this.voteService.castVote(user.userId, proposalId, body);

    return reply.status(200).send({
      success: true,
      data: vote,
    });
  }

  /**
   * DELETE /votes/:id - Remove vote
   */
  async deleteVote(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    await this.voteService.deleteVote(id, user.userId);

    return reply.status(204).send();
  }

  /**
   * GET /meals/:id/votes/my-votes - Get current user's votes for a meal
   */
  async getUserVotesForMeal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const votes = await this.voteService.getUserVotesForMeal(id, user.userId);

    return reply.status(200).send({
      success: true,
      data: votes,
    });
  }

  /**
   * POST /meals/:id/votes/bulk - Submit all votes for a meal at once
   */
  async bulkCastVotes(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id: mealId } = request.params as { id: string };
    const body = request.body as BulkVoteInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const votes = await this.voteService.bulkCastVotes(user.userId, mealId, body);

    return reply.status(200).send({
      success: true,
      data: votes,
    });
  }
}
