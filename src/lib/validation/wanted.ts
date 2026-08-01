import { z } from 'zod';
import { CATEGORIES, KGP_HALLS } from '../constants';

const categoryEnum = z.enum(
  CATEGORIES.map((c) => c.id) as [string, ...string[]],
  { errorMap: () => ({ message: 'Please select a valid category' }) }
);

export const wantedRequestSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(80, 'Title must be at most 80 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  category: categoryEnum,
  maxBudget: z
    .number({ invalid_type_error: 'Budget must be a valid number' })
    .int('Budget must be a whole rupee amount')
    .min(0, 'Budget cannot be negative')
    .max(500000, 'Budget cannot exceed ₹500,000')
    .optional()
    .nullable(),
  hallOfResidence: z.enum(KGP_HALLS, {
    errorMap: () => ({ message: 'Invalid hall of residence' }),
  }),
});

export type WantedRequestFormInput = z.infer<typeof wantedRequestSchema>;
