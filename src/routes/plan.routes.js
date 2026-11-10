import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/authorize.js';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js';
import { validate } from '../middleware/validate.js';
import {
  createPlanSchema,
  updatePlanSchema,
} from '../validators/plan.validator.js';
import {
  createPlan,
  deletePlan,
  getPlan,
  listPlans,
  updatePlan,
} from '../controllers/plan.controller.js';

const router = express.Router();

router.get('/', optionalAuthenticate, asyncHandler(listPlans));
router.get('/:id', optionalAuthenticate, asyncHandler(getPlan));
router.post('/', authenticate, requireAdmin, validate(createPlanSchema), asyncHandler(createPlan));
router.put('/:id', authenticate, requireAdmin, validate(updatePlanSchema), asyncHandler(updatePlan));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(deletePlan));

export default router;
