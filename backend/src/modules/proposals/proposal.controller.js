const proposalService = require('./proposal.service');

async function createProposal(req, res) {
  const proposal = await proposalService.createProposal(req.params.mealId, req.body, req.user.userId);
  res.status(201).json({ success: true, data: proposal });
}

async function getMealProposals(req, res) {
  const proposals = await proposalService.getMealProposals(req.params.mealId, req.user.userId);
  res.json({ success: true, data: proposals });
}

async function getProposal(req, res) {
  const proposal = await proposalService.getProposal(req.params.id, req.user.userId);
  res.json({ success: true, data: proposal });
}

async function updateProposal(req, res) {
  const proposal = await proposalService.updateProposal(req.params.id, req.body, req.user.userId);
  res.json({ success: true, data: proposal });
}

async function deleteProposal(req, res) {
  await proposalService.deleteProposal(req.params.id, req.user.userId);
  res.json({ success: true, data: { message: 'Proposal deleted' } });
}

module.exports = { createProposal, getMealProposals, getProposal, updateProposal, deleteProposal };
