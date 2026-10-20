import { z } from 'zod';

export const createOrderSchema = z.object({
  productId: z.string({
    required_error: 'Product ID is required',
  }).min(1, 'Product ID cannot be empty'),
  quantity: z.number({
    required_error: 'Quantity is required',
  }).int('Quantity must be an integer').min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
