import { z } from 'zod';

export const createPaymentSchema = z.object({
  subscriptionId: z.string().min(1),
  paymentMethod: z.enum(['card', 'upi', 'netbanking']).optional(),
  // Simulation control only: 'success' (default) or 'failure'.
  simulate: z.enum(['success', 'failure']).optional(),
  idempotencyKey: z.string().trim().min(1).max(100).optional(),
});
