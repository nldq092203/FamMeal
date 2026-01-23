import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotificationController } from './notification.controller';

export async function notificationRoutes(app: FastifyInstance) {
  const controller = new NotificationController();

  const familyIdParams = z.object({
    familyId: z.string().uuid(),
  });

  const familyAndNotificationParams = z.object({
    familyId: z.string().uuid(),
    id: z.string().uuid(),
  });

  const listQuery = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().datetime().optional(),
  });

  // GET /api/families/:familyId/notifications
  app.get(
    '/:familyId/notifications',
    {
      preValidation: async (request) => {
        request.params = familyIdParams.parse(request.params);
        const parsed = listQuery.parse(request.query);
        request.query = {
          limit: parsed.limit,
          cursor: parsed.cursor ? new Date(parsed.cursor) : undefined,
        };
      },
    },
    controller.listNotifications.bind(controller)
  );

  // GET /api/families/:familyId/notifications/unread-count
  app.get(
    '/:familyId/notifications/unread-count',
    {
      preValidation: async (request) => {
        request.params = familyIdParams.parse(request.params);
      },
    },
    controller.unreadCount.bind(controller)
  );

  // POST /api/families/:familyId/notifications/:id/read
  app.post(
    '/:familyId/notifications/:id/read',
    {
      preValidation: async (request) => {
        request.params = familyAndNotificationParams.parse(request.params);
      },
    },
    controller.markAsRead.bind(controller)
  );

  // POST /api/families/:familyId/notifications/read-all
  app.post(
    '/:familyId/notifications/read-all',
    {
      preValidation: async (request) => {
        request.params = familyIdParams.parse(request.params);
      },
    },
    controller.markAllAsRead.bind(controller)
  );
}

