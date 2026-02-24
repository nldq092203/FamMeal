const { Meal, Proposal, Vote, User } = require('../../db/models');
const { checkFamilyRole } = require('../../middleware/rbac.middleware');
const { NotFoundError } = require('../../shared/errors');

function getSelectedProposalIds(finalDecision) {
  if (!finalDecision || typeof finalDecision !== 'object') return [];
  if (Array.isArray(finalDecision.selectedProposalIds)) return finalDecision.selectedProposalIds.filter(Boolean);
  if (typeof finalDecision.selectedProposalId === 'string' && finalDecision.selectedProposalId) return [finalDecision.selectedProposalId];
  return [];
}

function computeVoteStats(votes, proposalCount) {
  const safeVotes = Array.isArray(votes) ? votes : [];
  const voteCount = safeVotes.length;
  if (voteCount === 0) return { voteCount: 0, averageRank: 0, totalScore: 0 };

  const sumRank = safeVotes.reduce((sum, v) => sum + (typeof v.rankPosition === 'number' ? v.rankPosition : 0), 0);
  const averageRank = sumRank / voteCount;

  // Simple Borda-style scoring: higher score is better.
  const totalScore = safeVotes.reduce((sum, v) => {
    const rank = typeof v.rankPosition === 'number' ? v.rankPosition : null;
    if (!rank) return sum;
    const score = proposalCount - rank + 1;
    return sum + (score > 0 ? score : 0);
  }, 0);

  return { voteCount, averageRank, totalScore };
}

function toMealSummary(mealJson, currentUserId) {
  const selectedIds = new Set(getSelectedProposalIds(mealJson.finalDecision));
  const proposalsRaw = Array.isArray(mealJson.proposals) ? mealJson.proposals : [];
  const proposalCount = proposalsRaw.length;

  const proposals = proposalsRaw
    .filter((p) => !p?.deletedAt)
    .map((p) => {
      const votesRaw = Array.isArray(p.votes) ? p.votes : [];
      const votes = votesRaw.filter((v) => !v?.deletedAt);
      const voteStats = computeVoteStats(votes, proposalCount);
      const userName = p.user?.name ?? '';
      const userUsername = p.user?.username ?? '';

      let myVote;
      if (currentUserId) {
        const mine = votes.find((v) => v.userId === currentUserId);
        if (mine) myVote = { id: mine.id, proposalId: mine.proposalId, rankPosition: mine.rankPosition };
      }

      return {
        id: p.id,
        mealId: p.mealId,
        userId: p.userId,
        dishName: p.dishName,
        ingredients: p.ingredients,
        notes: p.notes,
        extra: p.extra,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
        userName,
        userUsername,
        voteStats,
        isSelected: selectedIds.has(p.id),
        ...(myVote ? { myVote } : {}),
      };
    });

  const voteSummary = proposals.map((p) => ({
    proposalId: p.id,
    dishName: p.dishName,
    voteCount: p.voteStats.voteCount,
    averageRank: p.voteStats.averageRank,
    totalScore: p.voteStats.totalScore,
    proposedBy: p.userName || p.userUsername || 'Unknown',
  }));

  const myVotes = currentUserId
    ? proposals
        .flatMap((p) => (p.myVote ? [{ id: p.myVote.id, proposalId: p.id, userId: currentUserId, rankPosition: p.myVote.rankPosition }] : []))
    : undefined;

  const meal = { ...mealJson };
  delete meal.proposals;

  return {
    meal,
    proposals,
    voteSummary,
    ...(myVotes ? { myVotes } : {}),
    ...(mealJson.finalDecision ? { finalDecision: mealJson.finalDecision } : {}),
  };
}

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

  return toMealSummary(meal.toJSON(), userId);
}

async function getFamilyHistory(familyId, userId, { limit = 20, offset = 0 }) {
  await checkFamilyRole(userId, familyId, 'MEMBER');

  const meals = await Meal.findAll({
    where: { familyId, deletedAt: null, status: 'COMPLETED' },
    order: [['finalizedAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: Proposal,
        as: 'proposals',
        where: { deletedAt: null },
        required: false,
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] },
          { model: Vote, as: 'votes', attributes: ['id', 'userId', 'rankPosition', 'proposalId'], required: false },
        ],
      },
      { model: User, as: 'cook', attributes: ['id', 'username', 'name', 'avatarId'] },
    ],
  });

  return meals.map((m) => {
    const mealJson = typeof m?.toJSON === 'function' ? m.toJSON() : m;
    const proposals = Array.isArray(mealJson.proposals) ? mealJson.proposals : [];
    const proposalCount = proposals.length;
    const voteCount = proposals.reduce((sum, p) => sum + (Array.isArray(p.votes) ? p.votes.length : 0), 0);
    const scheduledFor = mealJson.scheduledFor || mealJson.date || null;
    const date = typeof scheduledFor === 'string' ? scheduledFor.slice(0, 10) : null;
    const hasFinalDecision = Boolean(getSelectedProposalIds(mealJson.finalDecision).length);

    return {
      id: mealJson.id,
      date: date || '',
      mealType: mealJson.mealType,
      status: mealJson.status,
      proposalCount,
      voteCount,
      votingClosedAt: mealJson.votingClosedAt ?? undefined,
      finalizedAt: mealJson.finalizedAt ?? undefined,
      hasFinalDecision,
      cookUserId: mealJson.cookUserId ?? undefined,
    };
  });
}

module.exports = { getMealSummary, getFamilyHistory };
