const { Router } = require('express');
const controller = require('./auth.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authMiddleware } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimiter.middleware');
const { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validation');
const asyncHandler = require('../../shared/asyncHandler');

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(controller.refresh));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.get('/me', authMiddleware, asyncHandler(controller.me));

module.exports = router;
