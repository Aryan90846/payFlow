import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(500),
  price: z.number().min(0),
  currency: z.string().trim().min(3).max(3).optional(),
  billingInterval: z.enum(['monthly', 'yearly']),
  features: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();
