import { FastifyRequest, FastifyReply } from 'fastify';
import { ProposalService } from './proposal.service';
import { CreateProposalInput, UpdateProposalInput } from './proposal.schema';
import { UnauthorizedError } from '@/shared/errors.js';

export class ProposalController {
  private proposalService: ProposalService;

  constructor() {
    this.proposalService = new ProposalService();
  }

  /**
   * POST /meals/:mealId/proposals - Create new proposal
   */
  async createProposal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { mealId } = request.params as { mealId: string };
    const body = request.body as CreateProposalInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const proposal = await this.proposalService.createProposal(user.userId, mealId, body);

    return reply.status(201).send({
      success: true,
      data: proposal,
    });
  }

  /**
   * GET /meals/:mealId/proposals - List proposals for a meal
   */
  async getMealProposals(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { mealId } = request.params as { mealId: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const proposals = await this.proposalService.getMealProposals(user.userId, mealId);

    return reply.send({
      success: true,
      data: proposals,
    });
  }

  /**
   * GET /proposals/:id - Get proposal details
   */
  async getProposal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const proposal = await this.proposalService.getProposalById(id, user.userId);

    return reply.send({
      success: true,
      data: proposal,
    });
  }

  /**
   * PATCH /proposals/:id - Update proposal
   */
  async updateProposal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateProposalInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const proposal = await this.proposalService.updateProposal(id, user.userId, body);

    return reply.send({
      success: true,
      data: proposal,
    });
  }

  /**
   * DELETE /proposals/:id - Delete proposal
   */
  async deleteProposal(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    await this.proposalService.deleteProposal(id, user.userId);

    return reply.status(204).send();
  }
}
