const { Op } = require('sequelize');
const { ScheduledNotification, FamilyMember, Notification, CronState } = require('../../db/models');
const { logger } = require('../../shared/logger');

async function runNotificationSchedulerWindowedJob({ limit = 200 } = {}) {
  const now = new Date();

  const scheduled = await ScheduledNotification.findAll({
    where: {
      status: 'PENDING',
      scheduledAt: { [Op.lte]: now },
    },
    limit,
    order: [['scheduledAt', 'ASC']],
  });

  let sent = 0;

  for (const sn of scheduled) {
    const members = await FamilyMember.findAll({ where: { familyId: sn.familyId } });

    const notifications = members.map((m) => ({
      userId: m.userId,
      familyId: sn.familyId,
      type: sn.type,
      refId: sn.refId,
    }));

    await Notification.bulkCreate(notifications, { ignoreDuplicates: true });

    await ScheduledNotification.update({ status: 'DONE' }, { where: { id: sn.id } });
    sent += notifications.length;
  }

  await CronState.upsert({ jobName: 'notification-scheduler', lastRunAt: now });

  logger.info('Notification scheduler job completed', { processed: scheduled.length, sent });
  return { processed: scheduled.length, sent };
}

async function runNotificationCleanupJob() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const deleted = await Notification.destroy({
    where: {
      isRead: true,
      createdAt: { [Op.lt]: thirtyDaysAgo },
    },
  });

  const canceledScheduled = await ScheduledNotification.update(
    { status: 'CANCELED' },
    {
      where: {
        status: 'PENDING',
        scheduledAt: { [Op.lt]: thirtyDaysAgo },
      },
    }
  );

  await CronState.upsert({ jobName: 'notification-cleanup', lastRunAt: new Date() });

  logger.info('Notification cleanup job completed', { deletedNotifications: deleted, canceledScheduled: canceledScheduled[0] });
  return { deletedNotifications: deleted, canceledScheduled: canceledScheduled[0] };
}

module.exports = { runNotificationSchedulerWindowedJob, runNotificationCleanupJob };
