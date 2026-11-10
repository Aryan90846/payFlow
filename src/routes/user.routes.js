import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileSchema,
  updateUserRoleSchema,
} from '../validators/user.validator.js';
import {
  getProfile,
  getUserById,
  listUsers,
  updateProfile,
  updateUserRole,
} from '../controllers/user.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', asyncHandler(getProfile));
router.put('/me', validate(updateProfileSchema), asyncHandler(updateProfile));
router.get('/', requireAdmin, asyncHandler(listUsers));
router.get('/:id', requireAdmin, asyncHandler(getUserById));
router.put('/:id/role', requireAdmin, validate(updateUserRoleSchema), asyncHandler(updateUserRole));

export default router;
