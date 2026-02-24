const Joi = require('joi');

const createVoteSchema = Joi.object({
  rankPosition: Joi.number().integer().min(1).required(),
});

const bulkVoteSchema = Joi.object({
  votes: Joi.array().items(
    Joi.object({
      proposalId: Joi.string().uuid().required(),
      rankPosition: Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),
});

const voteIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const proposalIdParamSchema = Joi.object({
  proposalId: Joi.string().uuid().required(),
});

module.exports = { createVoteSchema, bulkVoteSchema, voteIdParamSchema, proposalIdParamSchema };
