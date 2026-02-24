const { Meal, Proposal, Vote, User } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError } = require('../../shared/errors');

async function getMealSummary(mealId, userId) {
  const meal = await Meal.findOne({
    where: { id: mealId, deletedAt: null },
    include: [
      {
        model: Proposal,
        as: 'proposals',
        where: { deletedAt: null },
        required: false,
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] },
          { model: Vote, as: 'votes', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name'] }] },
        ],
      },
      { model: User, as: 'cook', attributes: ['id', 'username', 'name', 'avatarId'] },
    ],
  });

  if (!meal) throw new NotFoundError('Meal not found');
  await checkFamilyRole(userId, meal.familyId, 'MEMBER');

  return meal;
}

async function getFamilyHistory(familyId, userId, { limit = 20, offset = 0 }) {
  await checkFamilyRole(userId, familyId, 'MEMBER');

  const meals = await Meal.findAll({
    where: { familyId, deletedAt: null, status: 'COMPLETED' },
    order: [['finalizedAt', 'DESC']],
    limit,
    offset,
    include: [
      { model: Proposal, as: 'proposals', where: { deletedAt: null }, required: false, include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] },
      { model: User, as: 'cook', attributes: ['id', 'username', 'name', 'avatarId'] },
    ],
  });

  return meals;
}

module.exports = { getMealSummary, getFamilyHistory };
