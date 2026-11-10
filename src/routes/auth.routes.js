import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  loginLimiter,
  passwordRecoveryLimiter,
} from '../middleware/rateLimit.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';
import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(getMe));
router.post(
  '/forgot-password',
  passwordRecoveryLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(forgotPassword)
);
router.post(
  '/reset-password',
  passwordRecoveryLimiter,
  validate(resetPasswordSchema),
  asyncHandler(resetPassword)
);

export default router;
