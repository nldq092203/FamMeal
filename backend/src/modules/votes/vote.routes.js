const { Router } = require('express');
const controller = require('./vote.controller');
const { validate } = require('../../middleware/validate.middleware');
const { createVoteSchema, voteIdParamSchema, proposalIdParamSchema } = require('./vote.validation');
const asyncHandler = require('../../shared/asyncHandler');

const proposalVoteRouter = Router({ mergeParams: true });
proposalVoteRouter.post('/:proposalId/votes', validate(proposalIdParamSchema, 'params'), validate(createVoteSchema), asyncHandler(controller.castVote));

const directVoteRouter = Router();
directVoteRouter.delete('/:id', validate(voteIdParamSchema, 'params'), asyncHandler(controller.deleteVote));

module.exports = { proposalVoteRouter, directVoteRouter };
