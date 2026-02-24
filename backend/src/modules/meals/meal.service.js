const { Op } = require('sequelize');
const { Meal, Proposal, Vote, User, Family } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../shared/errors');

async function listMeals(query, userId) {
  await checkFamilyRole(userId, query.familyId, 'MEMBER');

  const where = { familyId: query.familyId, deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.from) where.scheduledFor = { ...where.scheduledFor, [Op.gte]: new Date(query.from) };
  if (query.to) where.scheduledFor = { ...where.scheduledFor, [Op.lte]: new Date(query.to) };

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
