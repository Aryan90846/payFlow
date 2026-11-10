import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  changePlanSchema,
  createSubscriptionSchema,
} from '../validators/subscription.validator.js';
import {
  cancelSubscription,
  changePlan,
  createSubscription,
  getCurrentSubscription,
  getSubscription,
  listSubscriptions,
} from '../controllers/subscription.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createSubscriptionSchema), asyncHandler(createSubscription));
router.get('/', asyncHandler(listSubscriptions));
router.get('/me/current', asyncHandler(getCurrentSubscription));
router.get('/:id', asyncHandler(getSubscription));
router.put('/:id/change-plan', validate(changePlanSchema), asyncHandler(changePlan));
router.put('/:id/cancel', asyncHandler(cancelSubscription));

export default router;
