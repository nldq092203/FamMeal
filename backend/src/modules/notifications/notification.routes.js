const { Router } = require('express');
const Joi = require('joi');
const controller = require('./notification.controller');
const { validate } = require('../../middleware/validate.middleware');
const asyncHandler = require('../../shared/asyncHandler');

const familyIdParams = Joi.object({
  familyId: Joi.string().uuid().required(),
});

const familyAndNotificationParams = Joi.object({
  familyId: Joi.string().uuid().required(),
  id: Joi.string().uuid().required(),
});

const router = Router({ mergeParams: true });

router.get('/:familyId/notifications', validate(familyIdParams, 'params'), asyncHandler(controller.listNotifications));
router.get('/:familyId/notifications/unread-count', validate(familyIdParams, 'params'), asyncHandler(controller.unreadCount));
router.post('/:familyId/notifications/:id/read', validate(familyAndNotificationParams, 'params'), asyncHandler(controller.markAsRead));
router.post('/:familyId/notifications/read-all', validate(familyIdParams, 'params'), asyncHandler(controller.markAllAsRead));

module.exports = router;
