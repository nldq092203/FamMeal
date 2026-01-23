import { FastifyReply, FastifyRequest } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { families } from '@/db/schema/family.table';
import { familyMembers } from '@/db/schema/family-member.table';
import { NotificationService } from '@/modules/notifications/notification.service';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/shared/errors.js';

type ListNotificationsQuery = {
  limit: number;
  cursor?: Date;
};

export class NotificationController {
  private readonly service = new NotificationService();

  private async assertFamilyAccess(familyId: string, userId: string): Promise<void> {
    const [family] = await db
      .select({ id: families.id })
      .from(families)
      .where(eq(families.id, familyId));

    if (!family) {
      throw new NotFoundError('Family not found');
    }

    const [membership] = await db
      .select({ familyId: familyMembers.familyId })
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      ));

    if (!membership) {
      throw new ForbiddenError('You are not a member of this family');
    }
  }

  async listNotifications(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user;
    if (!user) throw new UnauthorizedError();

    const { familyId } = request.params as { familyId: string };
    const query = request.query as ListNotificationsQuery;

    await this.assertFamilyAccess(familyId, user.userId);

    const items = await this.service.list({
      userId: user.userId,
      familyId,
      limit: query.limit,
      cursor: query.cursor,
    });

    const mapped = items.map((i) => ({
      id: i.id,
      type: i.type,
      refId: i.refId,
      isRead: i.isRead,
      createdAt: i.createdAt.toISOString(),
      readAt: i.readAt ? i.readAt.toISOString() : null,
    }));

    const nextCursor = mapped.length ? mapped[mapped.length - 1]!.createdAt : null;

    return reply.send({
      items: mapped,
      nextCursor,
    });
  }

  async unreadCount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user;
    if (!user) throw new UnauthorizedError();

    const { familyId } = request.params as { familyId: string };

    await this.assertFamilyAccess(familyId, user.userId);

    const count = await this.service.unreadCount({
      userId: user.userId,
      familyId,
    });

    return reply.send({ count });
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user;
    if (!user) throw new UnauthorizedError();

    const { familyId, id } = request.params as { familyId: string; id: string };

    await this.assertFamilyAccess(familyId, user.userId);

    await this.service.markAsRead({
      notificationId: id,
      userId: user.userId,
      familyId,
    });

    return reply.status(204).send();
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user;
    if (!user) throw new UnauthorizedError();

    const { familyId } = request.params as { familyId: string };

    await this.assertFamilyAccess(familyId, user.userId);

    const updated = await this.service.markAllAsRead({
      userId: user.userId,
      familyId,
    });

    return reply.send({ updated });
  }
}

