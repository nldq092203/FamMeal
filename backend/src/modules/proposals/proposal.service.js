const { Proposal, Meal, User, Vote } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../shared/errors');

async function createProposal(mealId, data, userId) {
  const meal = await Meal.findOne({ where: { id: mealId, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'MEMBER');

  if (meal.status !== 'PLANNING') {
    throw new ValidationError('Can only add proposals to meals in PLANNING status');
  }

  const proposal = await Proposal.create({ ...data, mealId, userId });

  return Proposal.findByPk(proposal.id, {
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }],
  });
}

async function getMealProposals(mealId, userId) {
  const meal = await Meal.findOne({ where: { id: mealId, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'MEMBER');

  return Proposal.findAll({
    where: { mealId, deletedAt: null },
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] },
      { model: Vote, as: 'votes', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name'] }] },
    ],
    order: [['createdAt', 'ASC']],
  });
}

async function getProposal(id, userId) {
  const proposal = await Proposal.findOne({
    where: { id, deletedAt: null },
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] },
      { model: Meal, as: 'meal', attributes: ['id', 'familyId', 'status'] },
      { model: Vote, as: 'votes', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name'] }] },
    ],
  });

  if (!proposal) throw new NotFoundError('Proposal not found');
  await checkFamilyRole(userId, proposal.meal.familyId, 'MEMBER');

  return proposal;
}

async function updateProposal(id, data, userId) {
  const proposal = await Proposal.findOne({
    where: { id, deletedAt: null },
    include: [{ model: Meal, as: 'meal', attributes: ['id', 'familyId', 'status'] }],
  });

  if (!proposal) throw new NotFoundError('Proposal not found');
  if (proposal.userId !== userId) throw new ForbiddenError('You can only edit your own proposals');
  if (proposal.meal.status !== 'PLANNING') throw new ValidationError('Cannot edit proposals after voting is closed');

  await Proposal.update({ ...data, updatedAt: new Date() }, { where: { id } });

  return Proposal.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }],
  });
}

async function deleteProposal(id, userId) {
  const proposal = await Proposal.findOne({
    where: { id, deletedAt: null },
    include: [{ model: Meal, as: 'meal', attributes: ['id', 'familyId', 'status'] }],
  });

  if (!proposal) throw new NotFoundError('Proposal not found');
  if (proposal.userId !== userId) throw new ForbiddenError('You can only delete your own proposals');

  await Proposal.update({ deletedAt: new Date() }, { where: { id } });
}

module.exports = { createProposal, getMealProposals, getProposal, updateProposal, deleteProposal };
