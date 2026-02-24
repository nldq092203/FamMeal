const notificationService = require('./notification.service');

async function listNotifications(req, res) {
  const { familyId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 20;
  const cursor = req.query.cursor || undefined;
  const notifications = await notificationService.listNotifications(familyId, req.user.userId, { limit, cursor });
  const items = notifications.map((n) => (typeof n?.toJSON === 'function' ? n.toJSON() : n));
  const nextCursor = items.length >= limit ? (items[items.length - 1]?.createdAt ?? null) : null;
  res.json({ success: true, data: { items, nextCursor } });
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
  const updated = await notificationService.markAllAsRead(req.params.familyId, req.user.userId);
  res.json({ success: true, data: { updated } });
}

module.exports = { listNotifications, unreadCount, markAsRead, markAllAsRead };
