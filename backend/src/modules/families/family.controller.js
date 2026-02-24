const familyService = require('./family.service');

async function createFamily(req, res) {
  const family = await familyService.createFamily(req.body, req.user.userId);
  res.status(201).json({ success: true, data: family });
}

async function getMyFamilies(req, res) {
  const families = await familyService.getMyFamilies(req.user.userId);
  res.json({ success: true, data: families });
}

async function getFamily(req, res) {
  const family = await familyService.getFamilyById(req.params.id, req.user.userId);
  res.json({ success: true, data: family });
}

async function updateFamily(req, res) {
  const family = await familyService.updateFamily(req.params.id, req.body);
  res.json({ success: true, data: family });
}

async function updateFamilyProfile(req, res) {
  const family = await familyService.updateFamilyProfile(req.params.id, req.body);
  res.json({ success: true, data: family });
}

async function updateFamilySettings(req, res) {
  const family = await familyService.updateFamilySettings(req.params.id, req.body);
  res.json({ success: true, data: family });
}

async function deleteFamily(req, res) {
  await familyService.deleteFamily(req.params.id);
  res.json({ success: true, data: { message: 'Family deleted' } });
}

async function addMember(req, res) {
  const family = await familyService.addMember(req.params.id, req.body);
  res.status(201).json({ success: true, data: family });
}

async function removeMember(req, res) {
  await familyService.removeMember(req.params.id, req.params.memberId);
  res.json({ success: true, data: { message: 'Member removed' } });
}

module.exports = {
  createFamily,
  getMyFamilies,
  getFamily,
  updateFamily,
  updateFamilyProfile,
  updateFamilySettings,
  deleteFamily,
  addMember,
  removeMember,
};
