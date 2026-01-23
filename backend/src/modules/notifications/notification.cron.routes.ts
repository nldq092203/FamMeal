import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '@/config/env.js';
import { ForbiddenError } from '@/shared/errors.js';
import { runNotificationCleanupJob, runNotificationSchedulerWindowedJob } from '@/modules/notifications/notification.jobs.js';

export async function notificationCronRoutes(app: FastifyInstance) {
  const secretQuery = z.object({
    secret: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
  });

  const assertCronAuthorized = (request: { headers: Record<string, unknown>; query: unknown }) => {
    const parsed = secretQuery.parse(request.query);
    const vercelCron = request.headers['x-vercel-cron'] === '1';
    const secretOk = env.CRON_SECRET ? parsed.secret === env.CRON_SECRET : true;

    if (!vercelCron && !secretOk) {
      throw new ForbiddenError('Invalid cron secret');
    }

    return parsed;
  };

  // GET /api/cron/notifications/tick
  app.get('/tick', async (request, reply) => {
    const parsed = assertCronAuthorized(request);
    const result = await runNotificationSchedulerWindowedJob({ limit: parsed.limit ?? 500 });
    return reply.send(result);
  });

  // GET /api/cron/notifications/cleanup
  app.get('/cleanup', async (request, reply) => {
    assertCronAuthorized(request);
    const result = await runNotificationCleanupJob();
    return reply.send(result);
  });
}
