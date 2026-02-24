const { sequelize } = require('../../config/database');
const { Family, FamilyMember, User, Meal, Proposal } = require('../../db/models');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../shared/errors');

function toFamilyDto(family, opts = {}) {
  const userId = opts.userId;
  const json = family && typeof family.toJSON === 'function' ? family.toJSON() : family;
  if (!json) return json;
  const membersRaw = Array.isArray(json?.members) ? json.members : [];

  const members = membersRaw.map((m) => {
    const user = m?.user || {};
    return {
      userId: m.userId,
      username: user.username ?? m.username ?? '',
      name: user.name ?? m.name ?? '',
      avatarId: user.avatarId ?? m.avatarId ?? null,
      role: m.role,
      joinedAt: m.joinedAt,
    };
  });

  const myRole = userId ? members.find((m) => m.userId === userId)?.role : undefined;

  return {
    ...json,
    members,
    ...(myRole ? { myRole } : {}),
  };
}

async function createFamily(data, userId) {
  const t = await sequelize.transaction();
  try {
    const family = await Family.create(data, { transaction: t });

    await FamilyMember.create(
      { familyId: family.id, userId, role: 'ADMIN' },
      { transaction: t }
    );

    await t.commit();

    const result = await Family.findByPk(family.id, {
      include: [{ model: FamilyMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] }],
    });

    return toFamilyDto(result, { userId });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function getMyFamilies(userId) {
  const memberships = await FamilyMember.findAll({
    where: { userId },
    include: [{
      model: Family,
      as: 'family',
      where: { deletedAt: null },
      include: [{
        model: FamilyMember,
        as: 'members',
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }],
      }],
    }],
  });

  return memberships.map((m) => ({
    id: m.family.id,
    name: m.family.name,
    role: m.role,
    memberCount: m.family.members?.length ?? 0,
  }));
}

async function getFamilyById(id, userId) {
  const family = await Family.findOne({
    where: { id, deletedAt: null },
    include: [{
      model: FamilyMember,
      as: 'members',
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }],
    }],
  });

  if (!family) throw new NotFoundError('Family not found');

  const membership = family.members.find((m) => m.userId === userId);
  if (!membership) throw new ForbiddenError('You are not a member of this family');

  return toFamilyDto(family, { userId });
}

async function updateFamily(id, data) {
  const family = await Family.findOne({ where: { id, deletedAt: null } });
  if (!family) throw new NotFoundError('Family not found');

  await Family.update({ ...data, updatedAt: new Date() }, { where: { id } });

  const result = await Family.findByPk(id, {
    include: [{ model: FamilyMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] }],
  });
  return toFamilyDto(result);
}

async function updateFamilyProfile(id, data) {
  const family = await Family.findOne({ where: { id, deletedAt: null } });
  if (!family) throw new NotFoundError('Family not found');

  await Family.update({ ...data, updatedAt: new Date() }, { where: { id } });

  const result = await Family.findByPk(id, {
    include: [{ model: FamilyMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] }],
  });
  return toFamilyDto(result);
}

async function updateFamilySettings(id, settings) {
  const family = await Family.findOne({ where: { id, deletedAt: null } });
  if (!family) throw new NotFoundError('Family not found');

  const merged = { ...(family.settings || {}), ...settings };
  await Family.update({ settings: merged, updatedAt: new Date() }, { where: { id } });

  const result = await Family.findByPk(id, {
    include: [{ model: FamilyMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] }],
  });
  return toFamilyDto(result);
}

async function deleteFamily(id) {
  const [affectedCount] = await Family.update({ deletedAt: new Date() }, { where: { id, deletedAt: null } });
  if (affectedCount === 0) throw new NotFoundError('Family not found');
}

async function addMember(familyId, data) {
  const family = await Family.findOne({ where: { id: familyId, deletedAt: null } });
  if (!family) throw new NotFoundError('Family not found');

  const user = await User.findOne({ where: { id: data.userId, deletedAt: null } });
  if (!user) throw new NotFoundError('User not found');

  const existing = await FamilyMember.findOne({ where: { familyId, userId: data.userId } });
  if (existing) throw new ConflictError('User is already a member of this family');

  await FamilyMember.create({ familyId, userId: data.userId, role: data.role || 'MEMBER' });

  const result = await Family.findByPk(familyId, {
    include: [{ model: FamilyMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name', 'avatarId'] }] }],
  });
  return toFamilyDto(result);
}

async function removeMember(familyId, memberId) {
  const membership = await FamilyMember.findOne({ where: { familyId, userId: memberId } });
  if (!membership) throw new NotFoundError('Member not found in this family');

  await FamilyMember.destroy({ where: { familyId, userId: memberId } });
}

module.exports = {
  createFamily,
  getMyFamilies,
  getFamilyById,
  updateFamily,
  updateFamilyProfile,
  updateFamilySettings,
  deleteFamily,
  addMember,
  removeMember,
};
