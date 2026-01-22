import { FastifyInstance } from 'fastify';
import { VoteController } from './vote.controller';
import { createVoteSchema } from './vote.schema';
import { z } from 'zod';

export async function voteRoutes(app: FastifyInstance) {
  const voteController = new VoteController();
  const proposalIdParamSchema = z.object({ proposalId: z.string().uuid() });

  // Cast/Update vote for a proposal
  // Route: POST /api/proposals/:proposalId/votes
  // We will register this under /api/proposals in app.ts, so path here is /:proposalId/votes
  app.post(
    '/:proposalId/votes',
    {
      preValidation: async (request) => {
        request.params = proposalIdParamSchema.parse(request.params);
        request.body = createVoteSchema.parse(request.body);
      },
    },
    voteController.castVote.bind(voteController)
  );
}

export async function directVoteRoutes(app: FastifyInstance) {
  const voteController = new VoteController();
  const idParamSchema = z.object({ id: z.string().uuid() });

  // Delete vote
  // Route: DELETE /api/votes/:id
  app.delete(
    '/:id',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
      },
    },
    voteController.deleteVote.bind(voteController)
  );
}
