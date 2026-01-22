import { FastifyRequest, FastifyReply } from 'fastify';
import { VoteService } from './vote.service';
import { CreateVoteInput } from './vote.schema';
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
}
