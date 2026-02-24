const { sequelize } = require('../../config/database');
const { Vote, Proposal, Meal, User } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../shared/errors');

async function castVote(proposalId, data, userId) {
  const proposal = await Proposal.findOne({
    where: { id: proposalId, deletedAt: null },
    include: [{ model: Meal, as: 'meal', attributes: ['id', 'familyId', 'status'] }],
  });

  if (!proposal) throw new NotFoundError('Proposal not found');
  await checkFamilyRole(userId, proposal.meal.familyId, 'MEMBER');

  if (proposal.meal.status !== 'PLANNING') {
    throw new ValidationError('Cannot vote on meals that are not in PLANNING status');
  }

  const existing = await Vote.findOne({
    where: { proposalId, userId, rankPosition: data.rankPosition },
  });

  if (existing) {
    await Vote.update(
      { rankPosition: data.rankPosition, updatedAt: new Date() },
      { where: { id: existing.id } }
    );
    return Vote.findByPk(existing.id);
  }

  return Vote.create({ proposalId, userId, rankPosition: data.rankPosition });
}

async function bulkCastVotes(mealId, data, userId) {
  const meal = await Meal.findOne({ where: { id: mealId, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'MEMBER');

  if (meal.status !== 'PLANNING') {
    throw new ValidationError('Cannot vote on meals that are not in PLANNING status');
  }

  const proposalIds = data.votes.map((v) => v.proposalId);
  const proposals = await Proposal.findAll({
    where: { id: proposalIds, mealId, deletedAt: null },
  });

  if (proposals.length !== proposalIds.length) {
    throw new ValidationError('One or more proposals not found for this meal');
  }

  const t = await sequelize.transaction();
  try {
    await Vote.destroy({ where: { userId, proposalId: proposalIds }, transaction: t });

    const votesToCreate = data.votes.map((v) => ({
      proposalId: v.proposalId,
      userId,
      rankPosition: v.rankPosition,
    }));

    const created = await Vote.bulkCreate(votesToCreate, { transaction: t });
    await t.commit();
    return created;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function getUserVotesForMeal(mealId, userId) {
  const meal = await Meal.findOne({ where: { id: mealId, deletedAt: null } });
  if (!meal) throw new NotFoundError('Meal not found');

  await checkFamilyRole(userId, meal.familyId, 'MEMBER');

  const proposals = await Proposal.findAll({
    where: { mealId, deletedAt: null },
    attributes: ['id'],
  });

  const proposalIds = proposals.map((p) => p.id);

  return Vote.findAll({
    where: { userId, proposalId: proposalIds },
    include: [{ model: Proposal, as: 'proposal', attributes: ['id', 'dishName'] }],
    order: [['rankPosition', 'ASC']],
  });
}

async function deleteVote(id, userId) {
  const vote = await Vote.findByPk(id);
  if (!vote) throw new NotFoundError('Vote not found');

  if (vote.userId !== userId) {
    throw new ForbiddenError('You can only delete your own votes');
  }

  await Vote.destroy({ where: { id } });
}

module.exports = { castVote, bulkCastVotes, getUserVotesForMeal, deleteVote };
