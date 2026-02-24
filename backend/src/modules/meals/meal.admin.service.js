const { Meal, Proposal, Vote, User } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');

async function createMeal(data, userId) {
  await checkFamilyRole(userId, data.familyId, 'ADMIN');
  const meal = await Meal.create(data);
  return Meal.findByPk(meal.id);
}

async function updateMeal(id, data, userId) {
  const meal = await Meal.findOne({ where: { id, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'ADMIN');

  await Meal.update({ ...data, updatedAt: new Date() }, { where: { id } });
  return Meal.findByPk(id);
}

async function deleteMeal(id, userId) {
  const meal = await Meal.findOne({ where: { id, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'ADMIN');

  await Meal.update({ deletedAt: new Date() }, { where: { id } });
}

async function closeVoting(id, userId) {
  const meal = await Meal.findOne({ where: { id, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'ADMIN');

  if (meal.status !== 'PLANNING') {
    throw new ValidationError('Can only close voting for meals in PLANNING status');
  }

  await Meal.update(
    { status: 'LOCKED', votingClosedAt: new Date(), updatedAt: new Date() },
    { where: { id } }
  );

  return Meal.findByPk(id);
}

async function reopenVoting(id, userId) {
  const meal = await Meal.findOne({ where: { id, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'ADMIN');

  if (meal.status !== 'LOCKED') {
    throw new ValidationError('Can only reopen voting for meals in LOCKED status');
  }

  await Meal.update(
    { status: 'PLANNING', votingClosedAt: null, updatedAt: new Date() },
    { where: { id } }
  );

  return Meal.findByPk(id);
}

async function finalizeMeal(id, data, userId) {
  const meal = await Meal.findOne({ where: { id, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'ADMIN');

  const finalDecision = {
    selectedProposalIds: data.selectedProposalIds || (data.selectedProposalId ? [data.selectedProposalId] : []),
    selectedProposalId: data.selectedProposalId,
    decidedByUserId: userId,
    reason: data.reason,
  };

  const updateData = {
    status: 'COMPLETED',
    finalDecision,
    finalizedAt: new Date(),
    updatedAt: new Date(),
  };

  if (data.cookUserId) {
    updateData.cookUserId = data.cookUserId;
  }

  await Meal.update(updateData, { where: { id } });

  return Meal.findByPk(id, {
    include: [
      { model: Proposal, as: 'proposals', where: { deletedAt: null }, required: false, include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] },
      { model: User, as: 'cook', attributes: ['id', 'username', 'name', 'avatarId'] },
    ],
  });
}

module.exports = { createMeal, updateMeal, deleteMeal, closeVoting, reopenVoting, finalizeMeal };
