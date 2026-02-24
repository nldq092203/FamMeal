const { Router } = require('express');
const controller = require('./meal.admin.controller');
const { validate } = require('../../middleware/validate.middleware');
const { createMealSchema, updateMealSchema, finalizeMealSchema, mealIdParamSchema } = require('./meal.validation');
const asyncHandler = require('../../shared/asyncHandler');

const router = Router();

router.post('/', validate(createMealSchema), asyncHandler(controller.createMeal));
router.patch('/:id', validate(mealIdParamSchema, 'params'), validate(updateMealSchema), asyncHandler(controller.updateMeal));
router.delete('/:id', validate(mealIdParamSchema, 'params'), asyncHandler(controller.deleteMeal));
router.post('/:id/close-voting', validate(mealIdParamSchema, 'params'), asyncHandler(controller.closeVoting));
router.post('/:id/reopen-voting', validate(mealIdParamSchema, 'params'), asyncHandler(controller.reopenVoting));
router.post('/:id/finalize', validate(mealIdParamSchema, 'params'), validate(finalizeMealSchema), asyncHandler(controller.finalizeMeal));

module.exports = router;
