import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string({
    required_error: 'Order ID is required',
  }).min(1, 'Order ID cannot be empty'),
  simulatedOutcome: z.enum(['SUCCESS', 'DECLINE', 'TIMEOUT'], {
    errorMap: () => ({ message: "simulatedOutcome must be 'SUCCESS', 'DECLINE', or 'TIMEOUT'" }),
  }).default('SUCCESS'),
});

export const reconcilePaymentSchema = z.object({
  resolution: z.enum(['SUCCESS', 'DECLINE'], {
    errorMap: () => ({ message: "resolution must be either 'SUCCESS' or 'DECLINE'" }),
  }).default('SUCCESS'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ReconcilePaymentInput = z.infer<typeof reconcilePaymentSchema>;
