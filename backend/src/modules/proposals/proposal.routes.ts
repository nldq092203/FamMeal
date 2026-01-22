import { FastifyInstance } from 'fastify';
import { ProposalController } from './proposal.controller';
import { createProposalSchema, updateProposalSchema } from './proposal.schema';
import { z } from 'zod';

export async function proposalRoutes(app: FastifyInstance) {
  const proposalController = new ProposalController();
  const mealIdParamSchema = z.object({ mealId: z.string().uuid() });

  // POST /api/meals/:mealId/proposals
  app.post(
    '/:mealId/proposals',
    {
      preValidation: async (request) => {
        request.params = mealIdParamSchema.parse(request.params);
        request.body = createProposalSchema.parse(request.body);
      },
    },
    proposalController.createProposal.bind(proposalController)
  );

  app.get(
    '/:mealId/proposals',
    {
      preValidation: async (request) => {
        request.params = mealIdParamSchema.parse(request.params);
      },
    },
    proposalController.getMealProposals.bind(proposalController)
  );

  // DIRECT PROPOSAL ACCESS
  // Since this file will be registered under /api/meals AND /api/proposals? No, better to separate or have one place.
  // Best practice: Register this under /api without prefix, or split into two route files.
  // OR: Register this file TWICE? No.
  
  // Let's decide: 
  // 1. /api/meals/:mealId/proposals (Create, List) -> in MealRoutes? Or here but registered under /api/meals?
  // 2. /api/proposals/:id (Get, Update, Delete) -> in ProposalRoutes registered under /api/proposals.
  
  // I will put all here and we will register this route file under /api, and explicit paths.
}

// Separate route function for direct proposal access /api/proposals
export async function directProposalRoutes(app: FastifyInstance) {
  const proposalController = new ProposalController();
  const idParamSchema = z.object({ id: z.string().uuid() });

  app.get(
    '/:id',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
      },
    },
    proposalController.getProposal.bind(proposalController)
  );

  app.patch(
    '/:id',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
        request.body = updateProposalSchema.parse(request.body);
      },
    },
    proposalController.updateProposal.bind(proposalController)
  );

  app.delete(
    '/:id',
    {
      preValidation: async (request) => {
        request.params = idParamSchema.parse(request.params);
      },
    },
    proposalController.deleteProposal.bind(proposalController)
  );
}
