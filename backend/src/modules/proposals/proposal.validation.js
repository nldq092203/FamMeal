const Joi = require('joi');

const createProposalSchema = Joi.object({
  dishName: Joi.string().min(1).max(255).required(),
  ingredients: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  extra: Joi.object({
    imageUrls: Joi.array().items(Joi.string().uri()).optional(),
    restaurant: Joi.object({
      name: Joi.string().required(),
      addressUrl: Joi.string().uri().required(),
    }).optional(),
  }).optional(),
});

const updateProposalSchema = Joi.object({
  dishName: Joi.string().min(1).max(255).optional(),
  ingredients: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  extra: Joi.object({
    imageUrls: Joi.array().items(Joi.string().uri()).optional(),
    restaurant: Joi.object({
      name: Joi.string().required(),
      addressUrl: Joi.string().uri().required(),
    }).optional(),
  }).optional(),
});

const proposalIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const mealIdParamSchema = Joi.object({
  mealId: Joi.string().uuid().required(),
});

module.exports = { createProposalSchema, updateProposalSchema, proposalIdParamSchema, mealIdParamSchema };
