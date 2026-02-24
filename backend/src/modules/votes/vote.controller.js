const voteService = require('./vote.service');

async function castVote(req, res) {
  const vote = await voteService.castVote(req.params.proposalId, req.body, req.user.userId);
  res.status(201).json({ success: true, data: vote });
}

async function bulkCastVotes(req, res) {
  const votes = await voteService.bulkCastVotes(req.params.id, req.body, req.user.userId);
  res.status(201).json({ success: true, data: votes });
}

async function getUserVotesForMeal(req, res) {
  const votes = await voteService.getUserVotesForMeal(req.params.id, req.user.userId);
  res.json({ success: true, data: votes });
}

async function deleteVote(req, res) {
  await voteService.deleteVote(req.params.id, req.user.userId);
  res.json({ success: true, data: { message: 'Vote deleted' } });
}

module.exports = { castVote, bulkCastVotes, getUserVotesForMeal, deleteVote };
