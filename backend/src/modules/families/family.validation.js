const Joi = require('joi');

const AVATAR_IDS = [
  'panda', 'raccoon', 'cat', 'dog', 'rabbit', 'bear',
  'elephant', 'fox', 'giraffe', 'koala', 'penguin', 'frog', 'monkey',
];

const createFamilySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  avatarId: Joi.string().valid(...AVATAR_IDS).optional(),
  settings: Joi.object({
    defaultCuisinePreferences: Joi.array().items(Joi.string()).optional(),
    defaultDietaryRestrictions: Joi.array().items(Joi.string()).optional(),
    defaultMaxBudget: Joi.number().optional(),
    defaultMaxPrepTime: Joi.number().optional(),
  }).optional(),
});

const updateFamilySchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  avatarId: Joi.string().valid(...AVATAR_IDS).optional(),
  settings: Joi.object({
    defaultCuisinePreferences: Joi.array().items(Joi.string()).optional(),
    defaultDietaryRestrictions: Joi.array().items(Joi.string()).optional(),
    defaultMaxBudget: Joi.number().optional(),
    defaultMaxPrepTime: Joi.number().optional(),
  }).optional(),
});

const updateFamilyProfileSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  avatarId: Joi.string().valid(...AVATAR_IDS).optional(),
});

const updateFamilySettingsSchema = Joi.object({
  defaultCuisinePreferences: Joi.array().items(Joi.string()).optional(),
  defaultDietaryRestrictions: Joi.array().items(Joi.string()).optional(),
  defaultMaxBudget: Joi.number().allow(null).optional(),
  defaultMaxPrepTime: Joi.number().allow(null).optional(),
});

const addFamilyMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  role: Joi.string().valid('ADMIN', 'MEMBER').default('MEMBER'),
});

const familyIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const familyMemberParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  memberId: Joi.string().uuid().required(),
});

module.exports = {
  createFamilySchema,
  updateFamilySchema,
  updateFamilyProfileSchema,
  updateFamilySettingsSchema,
  addFamilyMemberSchema,
  familyIdParamSchema,
  familyMemberParamSchema,
};
