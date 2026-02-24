const { Router } = require('express');
const controller = require('./family.controller');
const { validate } = require('../../middleware/validate.middleware');
const { createFamilySchema, familyIdParamSchema } = require('./family.validation');
const asyncHandler = require('../../shared/asyncHandler');

const router = Router();

router.post('/', validate(createFamilySchema), asyncHandler(controller.createFamily));
router.get('/', asyncHandler(controller.getMyFamilies));
router.get('/:id', validate(familyIdParamSchema, 'params'), asyncHandler(controller.getFamily));

module.exports = router;
