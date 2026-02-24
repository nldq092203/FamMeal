const Joi = require('joi');

const DATA_IMAGE_URI_RE = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

function imageUrlSchema() {
  // Accept either a normal URL or a data URL (used by the current UI for uploads/previews).
  // Limit length to reduce accidental huge payloads.
  return Joi.string()
    .max(4_000_000)
    .custom((value, helpers) => {
      if (typeof value !== 'string') return helpers.error('string.base');
      if (value.startsWith('data:image/')) {
        if (!DATA_IMAGE_URI_RE.test(value)) return helpers.error('string.pattern.base');
        return value;
      }
      const { error } = Joi.string().uri({ scheme: ['http', 'https'] }).validate(value);
      if (error) return helpers.error('string.uri');
      return value;
    })
    .messages({
      'string.uri': 'Image URL must be a valid http(s) URL.',
      'string.pattern.base': 'Image data URL is not valid.',
    });
}

const createProposalSchema = Joi.object({
  dishName: Joi.string().min(1).max(255).required(),
  ingredients: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  extra: Joi.object({
    imageUrls: Joi.array().items(imageUrlSchema()).max(5).optional(),
    restaurant: Joi.object({
      name: Joi.string().required(),
      addressUrl: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
    }).optional(),
  }).optional(),
});

const updateProposalSchema = Joi.object({
  dishName: Joi.string().min(1).max(255).optional(),
  ingredients: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  extra: Joi.object({
    imageUrls: Joi.array().items(imageUrlSchema()).max(5).optional(),
    restaurant: Joi.object({
      name: Joi.string().required(),
      addressUrl: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
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
