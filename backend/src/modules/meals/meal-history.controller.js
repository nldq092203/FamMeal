const mealHistoryService = require('./meal-history.service');

async function getMealSummary(req, res) {
  const summary = await mealHistoryService.getMealSummary(req.params.id, req.user.userId);
  res.json({ success: true, data: summary });
}

async function getFamilyHistory(req, res) {
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const history = await mealHistoryService.getFamilyHistory(req.params.id, req.user.userId, { limit, offset });
  res.json({ success: true, data: history });
}

module.exports = { getMealSummary, getFamilyHistory };
