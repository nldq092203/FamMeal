const Joi = require('joi');

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'BRUNCH', 'OTHER'];

const createMealSchema = Joi.object({
  familyId: Joi.string().uuid().required(),
  scheduledFor: Joi.date().iso().required(),
  mealType: Joi.string().valid(...MEAL_TYPES).default('DINNER'),
  constraints: Joi.object({
    isDiningOut: Joi.boolean().optional(),
    maxBudget: Joi.number().optional(),
    maxPrepTimeMinutes: Joi.number().optional(),
    dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
    servings: Joi.number().integer().optional(),
  }).optional(),
});

const updateMealSchema = Joi.object({
  scheduledFor: Joi.date().iso().optional(),
  mealType: Joi.string().valid(...MEAL_TYPES).optional(),
  constraints: Joi.object({
    isDiningOut: Joi.boolean().optional(),
    maxBudget: Joi.number().optional(),
    maxPrepTimeMinutes: Joi.number().optional(),
    dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
    servings: Joi.number().integer().optional(),
  }).optional(),
});

const listMealsQuerySchema = Joi.object({
  familyId: Joi.string().uuid().required(),
  status: Joi.string().valid('PLANNING', 'LOCKED', 'COMPLETED').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

const finalizeMealSchema = Joi.object({
  selectedProposalIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
  selectedProposalId: Joi.string().uuid().optional(),
  reason: Joi.string().max(500).allow('').optional(),
  cookUserId: Joi.string().uuid().optional(),
});

const mealIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createMealSchema,
  updateMealSchema,
  listMealsQuerySchema,
  finalizeMealSchema,
  mealIdParamSchema,
};
