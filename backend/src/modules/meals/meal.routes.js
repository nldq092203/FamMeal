const { Router } = require('express');
const controller = require('./meal.controller');
const historyController = require('./meal-history.controller');
const voteController = require('../votes/vote.controller');
const { validate } = require('../../middleware/validate.middleware');
const { listMealsQuerySchema, mealIdParamSchema } = require('./meal.validation');
const { bulkVoteSchema } = require('../votes/vote.validation');
const asyncHandler = require('../../shared/asyncHandler');

const router = Router();

router.get('/', validate(listMealsQuerySchema, 'query'), asyncHandler(controller.listMeals));
router.get('/:id', validate(mealIdParamSchema, 'params'), asyncHandler(controller.getMeal));
router.get('/:id/summary', validate(mealIdParamSchema, 'params'), asyncHandler(historyController.getMealSummary));
router.post('/:id/votes/bulk', validate(mealIdParamSchema, 'params'), validate(bulkVoteSchema), asyncHandler(voteController.bulkCastVotes));
router.get('/:id/votes/my-votes', validate(mealIdParamSchema, 'params'), asyncHandler(voteController.getUserVotesForMeal));

module.exports = router;
