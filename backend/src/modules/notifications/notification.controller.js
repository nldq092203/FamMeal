const notificationService = require('./notification.service');

async function listNotifications(req, res) {
  const { familyId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 20;
  const cursor = req.query.cursor || undefined;
  const notifications = await notificationService.listNotifications(familyId, req.user.userId, { limit, cursor });
  res.json({ success: true, data: notifications });
}

async function unreadCount(req, res) {
  const count = await notificationService.getUnreadCount(req.params.familyId, req.user.userId);
  res.json({ success: true, data: { count } });
}

async function markAsRead(req, res) {
  await notificationService.markAsRead(req.params.familyId, req.params.id, req.user.userId);
  res.json({ success: true, data: { message: 'Notification marked as read' } });
}

async function markAllAsRead(req, res) {
  await notificationService.markAllAsRead(req.params.familyId, req.user.userId);
  res.json({ success: true, data: { message: 'All notifications marked as read' } });
}

module.exports = { listNotifications, unreadCount, markAsRead, markAllAsRead };
