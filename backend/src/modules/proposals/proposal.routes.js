const { Router } = require('express');
const controller = require('./proposal.controller');
const { validate } = require('../../middleware/validate.middleware');
const { createProposalSchema, updateProposalSchema, proposalIdParamSchema, mealIdParamSchema } = require('./proposal.validation');
const asyncHandler = require('../../shared/asyncHandler');

const mealProposalRouter = Router({ mergeParams: true });
mealProposalRouter.post('/:mealId/proposals', validate(mealIdParamSchema, 'params'), validate(createProposalSchema), asyncHandler(controller.createProposal));
mealProposalRouter.get('/:mealId/proposals', validate(mealIdParamSchema, 'params'), asyncHandler(controller.getMealProposals));

const directProposalRouter = Router();
directProposalRouter.get('/:id', validate(proposalIdParamSchema, 'params'), asyncHandler(controller.getProposal));
directProposalRouter.patch('/:id', validate(proposalIdParamSchema, 'params'), validate(updateProposalSchema), asyncHandler(controller.updateProposal));
directProposalRouter.delete('/:id', validate(proposalIdParamSchema, 'params'), asyncHandler(controller.deleteProposal));

module.exports = { mealProposalRouter, directProposalRouter };
