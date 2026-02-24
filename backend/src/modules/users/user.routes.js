const { Router } = require('express');
const controller = require('./user.controller');
const { validate } = require('../../middleware/validate.middleware');
const { userIdParamSchema, updateUserSchema, listUsersQuerySchema, suggestUsersQuerySchema } = require('./user.validation');
const asyncHandler = require('../../shared/asyncHandler');

const router = Router();

router.get('/', validate(listUsersQuerySchema, 'query'), asyncHandler(controller.listUsers));
router.get('/suggest', validate(suggestUsersQuerySchema, 'query'), asyncHandler(controller.suggestUsers));
router.get('/:id', validate(userIdParamSchema, 'params'), asyncHandler(controller.getUser));
router.patch('/:id', validate(userIdParamSchema, 'params'), validate(updateUserSchema), asyncHandler(controller.updateUser));
router.delete('/:id', validate(userIdParamSchema, 'params'), asyncHandler(controller.deleteUser));

module.exports = router;
