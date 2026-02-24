const mealAdminService = require('./meal.admin.service');

async function createMeal(req, res) {
  const meal = await mealAdminService.createMeal(req.body, req.user.userId);
  res.status(201).json({ success: true, data: meal });
}

async function updateMeal(req, res) {
  const meal = await mealAdminService.updateMeal(req.params.id, req.body, req.user.userId);
  res.json({ success: true, data: meal });
}

async function deleteMeal(req, res) {
  await mealAdminService.deleteMeal(req.params.id, req.user.userId);
  res.json({ success: true, data: { message: 'Meal deleted' } });
}

async function closeVoting(req, res) {
  const meal = await mealAdminService.closeVoting(req.params.id, req.user.userId);
  res.json({ success: true, data: meal });
}

async function reopenVoting(req, res) {
  const meal = await mealAdminService.reopenVoting(req.params.id, req.user.userId);
  res.json({ success: true, data: meal });
}

async function finalizeMeal(req, res) {
  const meal = await mealAdminService.finalizeMeal(req.params.id, req.body, req.user.userId);
  res.json({ success: true, data: meal });
}

module.exports = { createMeal, updateMeal, deleteMeal, closeVoting, reopenVoting, finalizeMeal };
