const Joi = require('joi');

const AVATAR_IDS = [
  'panda', 'raccoon', 'cat', 'dog', 'rabbit', 'bear',
  'elephant', 'fox', 'giraffe', 'koala', 'penguin', 'frog', 'monkey',
];

const userIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  username: Joi.string().min(3).max(100).optional(),
  avatarId: Joi.string().valid(...AVATAR_IDS).optional(),
});

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(255).allow('').optional(),
});

const suggestUsersQuerySchema = Joi.object({
  q: Joi.string().min(1).max(255).required(),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = { userIdParamSchema, updateUserSchema, listUsersQuerySchema, suggestUsersQuerySchema };
