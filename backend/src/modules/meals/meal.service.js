const { Op } = require('sequelize');
const { Meal, Proposal, Vote, User, Family } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError} = require('../../shared/errors');

function normalizeBoundaryDate(input, kind) {
  if (!input) return null;
  const d = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  const isMidnightUtc =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;

  if (kind === 'to' && isMidnightUtc) {
    d.setUTCHours(23, 59, 59, 999);
  }

  if (kind === 'from' && isMidnightUtc) {
    d.setUTCHours(0, 0, 0, 0);
  }

  return d;
}

async function listMeals(query, userId) {
  await checkFamilyRole(userId, query.familyId, 'MEMBER');

  const where = { familyId: query.familyId, deletedAt: null };
  if (query.status) where.status = query.status;

  const fromInput = query.from || query.startDate;
  const toInput = query.to || query.endDate;
  const from = normalizeBoundaryDate(fromInput, 'from');
  const to = normalizeBoundaryDate(toInput, 'to');

  if (from) where.scheduledFor = { ...where.scheduledFor, [Op.gte]: from };
  if (to) where.scheduledFor = { ...where.scheduledFor, [Op.lte]: to };

  const meals = await Meal.findAll({
    where,
    order: [['scheduledFor', 'ASC']],
    limit: query.limit || 20,
    offset: query.offset || 0,
    include: [
      { model: Proposal, as: 'proposals', where: { deletedAt: null }, required: false, include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] },
      { model: User, as: 'cook', attributes: ['id', 'username', 'name', 'avatarId'] },
    ],
  });

  return meals;
}

async function getMealById(id, userId) {
  const meal = await Meal.findOne({
    where: { id, deletedAt: null },
    include: [
      { model: Proposal, as: 'proposals', where: { deletedAt: null }, required: false, include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }, { model: Vote, as: 'votes', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name'] }] }] },
      { model: User, as: 'cook', attributes: ['id', 'username', 'name', 'avatarId'] },
      { model: Family, as: 'family', attributes: ['id', 'name'] },
    ],
  });

  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'MEMBER');
  return meal;
}

module.exports = { listMeals, getMealById };
