import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/authorize.js';
import {
  getDashboard,
  runExpiryCheck,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', asyncHandler(getDashboard));
router.post('/expire-subscriptions', asyncHandler(runExpiryCheck));

export default router;
