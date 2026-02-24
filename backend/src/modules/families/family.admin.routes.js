const { Router } = require('express');
const controller = require('./family.controller');
const { validate } = require('../../middleware/validate.middleware');
const { requireFamilyAdmin } = require('../../middleware/rbac.middleware');
const asyncHandler = require('../../shared/asyncHandler');
const {
  familyIdParamSchema,
  updateFamilySchema,
  updateFamilyProfileSchema,
  updateFamilySettingsSchema,
  addFamilyMemberSchema,
  familyMemberParamSchema,
} = require('./family.validation');

const router = Router();

router.delete('/:id', validate(familyIdParamSchema, 'params'), asyncHandler(requireFamilyAdmin), asyncHandler(controller.deleteFamily));
router.patch('/:id', validate(familyIdParamSchema, 'params'), asyncHandler(requireFamilyAdmin), validate(updateFamilySchema), asyncHandler(controller.updateFamily));
router.patch('/:id/profile', validate(familyIdParamSchema, 'params'), asyncHandler(requireFamilyAdmin), validate(updateFamilyProfileSchema), asyncHandler(controller.updateFamilyProfile));
router.patch('/:id/settings', validate(familyIdParamSchema, 'params'), asyncHandler(requireFamilyAdmin), validate(updateFamilySettingsSchema), asyncHandler(controller.updateFamilySettings));
router.post('/:id/members', validate(familyIdParamSchema, 'params'), asyncHandler(requireFamilyAdmin), validate(addFamilyMemberSchema), asyncHandler(controller.addMember));
router.delete('/:id/members/:memberId', validate(familyMemberParamSchema, 'params'), asyncHandler(requireFamilyAdmin), asyncHandler(controller.removeMember));

module.exports = router;
