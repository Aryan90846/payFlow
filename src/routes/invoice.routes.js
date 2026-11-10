import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  getInvoice,
  listInvoices,
} from '../controllers/invoice.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(listInvoices));
router.get('/:id', asyncHandler(getInvoice));

export default router;
