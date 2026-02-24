const { Op } = require('sequelize');
const { Notification, FamilyMember, ScheduledNotification, Meal, Proposal, User } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError } = require('../../shared/errors');
const { NotificationType } = require('../../shared/notifications');

async function listNotifications(familyId, userId, { limit = 20, cursor }) {
  await checkFamilyRole(userId, familyId, 'MEMBER');

  const where = { userId, familyId };
  if (cursor) {
    where.createdAt = { [Op.lt]: new Date(cursor) };
  }

  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
  });

  return notifications;
}

async function getUnreadCount(familyId, userId) {
  await checkFamilyRole(userId, familyId, 'MEMBER');

  const count = await Notification.count({
    where: { userId, familyId, isRead: false },
  });

  return count;
}

async function markAsRead(familyId, notificationId, userId) {
  await checkFamilyRole(userId, familyId, 'MEMBER');

  const [affectedCount] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id: notificationId, userId, familyId } }
  );

  if (affectedCount === 0) throw new NotFoundError('Notification not found');
}

async function markAllAsRead(familyId, userId) {
  await checkFamilyRole(userId, familyId, 'MEMBER');

  const [updated] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, familyId, isRead: false } }
  );

  return updated;
}

async function createNotificationsForFamily(familyId, type, refId, excludeUserId) {
  const members = await FamilyMember.findAll({ where: { familyId } });

  const notifications = members
    .filter((m) => m.userId !== excludeUserId)
    .map((m) => ({
      userId: m.userId,
      familyId,
      type,
      refId,
    }));

  if (notifications.length > 0) {
    await Notification.bulkCreate(notifications, { ignoreDuplicates: true });
  }

  return notifications.length;
}

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotificationsForFamily,
};
