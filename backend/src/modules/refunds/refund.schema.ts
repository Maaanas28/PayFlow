import { z } from 'zod';

export const createRefundSchema = z.object({
  amountMinor: z.number({
    invalid_type_error: 'amountMinor must be a positive integer in minor units (paise)',
  }).int('amountMinor must be an integer').positive('amountMinor must be greater than 0').optional(),
  reason: z.string().max(255, 'Reason cannot exceed 255 characters').optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
