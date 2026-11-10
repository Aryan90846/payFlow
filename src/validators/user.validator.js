import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'customer']),
});
