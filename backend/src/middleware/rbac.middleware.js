const { FamilyMember } = require('../db/models');
const { ForbiddenError, UnauthorizedError, ValidationError } = require('../shared/errors');

async function checkFamilyRole(userId, familyId, requiredRole = 'MEMBER') {
  const membership = await FamilyMember.findOne({
    where: { familyId, userId },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this family');
  }

  if (requiredRole === 'ADMIN' && membership.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }
}

async function requireFamilyAdmin(req, _res, next) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const familyId = req.params.familyId || req.params.id;

  if (!familyId) {
    throw new ValidationError('Family ID required in route params');
  }

  await checkFamilyRole(req.user.userId, familyId, 'ADMIN');
  next();
}

async function requireFamilyMembership(req, _res, next) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const familyId = req.params.familyId || req.params.id;

  if (!familyId) {
    throw new ValidationError('Family ID required in route params');
  }

  await checkFamilyRole(req.user.userId, familyId, 'MEMBER');
  next();
}

module.exports = { checkFamilyRole, requireFamilyAdmin, requireFamilyMembership };
