const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({ 'string.email': 'Invalid email address' }),
  password: Joi.string().min(8).required().messages({ 'string.min': 'Password must be at least 8 characters' }),
  username: Joi.string().min(3).max(100).required().messages({ 'string.min': 'Username must be at least 3 characters' }),
  name: Joi.string().min(1).max(255).required().messages({ 'any.required': 'Name is required' }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().min(1).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(1).required(),
  newPassword: Joi.string().min(8).required(),
});

module.exports = { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema };
