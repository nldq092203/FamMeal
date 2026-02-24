const mealService = require('./meal.service');

async function listMeals(req, res) {
  const meals = await mealService.listMeals(req.query, req.user.userId);
  res.json({ success: true, data: meals });
}

async function getMeal(req, res) {
  const meal = await mealService.getMealById(req.params.id, req.user.userId);
  res.json({ success: true, data: meal });
}

module.exports = { listMeals, getMeal };
