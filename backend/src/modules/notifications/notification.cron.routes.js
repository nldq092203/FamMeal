const { Router } = require('express');
const { env } = require('../../config/env');
const { ForbiddenError } = require('../../shared/errors');
const { runNotificationSchedulerWindowedJob, runNotificationCleanupJob } = require('./notification.jobs');
const asyncHandler = require('../../shared/asyncHandler');

const router = Router();

function assertCronAuthorized(req) {
  const vercelCron = req.headers['x-vercel-cron'] === '1';
  const secretOk = env.CRON_SECRET ? req.query.secret === env.CRON_SECRET : true;

  if (!vercelCron && !secretOk) {
    throw new ForbiddenError('Invalid cron secret');
  }
}

router.get('/tick', asyncHandler(async (req, res) => {
  assertCronAuthorized(req);
  const limit = parseInt(req.query.limit, 10) || 200;
  const result = await runNotificationSchedulerWindowedJob({ limit });
  res.json(result);
}));

router.get('/cleanup', asyncHandler(async (req, res) => {
  assertCronAuthorized(req);
  const result = await runNotificationCleanupJob();
  res.json(result);
}));

module.exports = router;
