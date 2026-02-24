const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const { env } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const { globalLimiter } = require('./middleware/rateLimiter.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const familyRoutes = require('./modules/families/family.routes');
const familyAdminRoutes = require('./modules/families/family.admin.routes');
const mealRoutes = require('./modules/meals/meal.routes');
const mealAdminRoutes = require('./modules/meals/meal.admin.routes');
const { mealProposalRouter, directProposalRouter } = require('./modules/proposals/proposal.routes');
const { proposalVoteRouter, directVoteRouter } = require('./modules/votes/vote.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const notificationCronRoutes = require('./modules/notifications/notification.cron.routes');
const historyController = require('./modules/meals/meal-history.controller');
const asyncHandler = require('./shared/asyncHandler');

function buildApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.use(hpp());
  app.use(globalLimiter);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use('/api/auth', authRoutes);

  if (env.CRON_ENABLED) {
    app.use('/api/cron/notifications', notificationCronRoutes);
  }

  app.use('/api/users', authMiddleware, userRoutes);
  app.use('/api/families', authMiddleware, familyRoutes);
  app.use('/api/families', authMiddleware, notificationRoutes);
  app.get('/api/families/:id/history', authMiddleware, asyncHandler(historyController.getFamilyHistory));
  app.use('/api/admin/families', authMiddleware, familyAdminRoutes);
  app.use('/api/meals', authMiddleware, mealRoutes);
  app.use('/api/meals', authMiddleware, mealProposalRouter);
  app.use('/api/admin/meals', authMiddleware, mealAdminRoutes);
  app.use('/api/proposals', authMiddleware, directProposalRouter);
  app.use('/api/proposals', authMiddleware, proposalVoteRouter);
  app.use('/api/votes', authMiddleware, directVoteRouter);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Route ${_req.method}:${_req.url} not found`,
        code: 'NOT_FOUND',
      },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { buildApp };
