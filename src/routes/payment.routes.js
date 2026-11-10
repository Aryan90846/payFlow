import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { createPaymentSchema } from '../validators/payment.validator.js';
import {
  createPayment,
  getPayment,
  listPayments,
} from '../controllers/payment.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createPaymentSchema), asyncHandler(createPayment));
router.get('/', asyncHandler(listPayments));
router.get('/:id', asyncHandler(getPayment));

export default router;
