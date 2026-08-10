import { z } from 'zod';
import { CATEGORIES, CONDITIONS, KGP_HALLS } from '../constants';

const categoryEnum = z.enum(
 CATEGORIES.map((c) => c.id) as [string, ...string[]],
 { errorMap: () => ({ message: 'Please select a valid category' }) }
);

const conditionEnum = z.enum(
 CONDITIONS.map((c) => c.id) as [string, ...string[]],
 { errorMap: () => ({ message: 'Please select item condition' }) }
);

export const listingSchema = z.object({
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
 price: z
 .number({ invalid_type_error: 'Price must be a valid number' })
 .int('Price must be a whole rupee amount')
 .min(0, 'Price cannot be negative')
 .max(500000, 'Price cannot exceed ₹500,000'),
 isNegotiable: z.boolean().default(false),
 condition: conditionEnum,
 hallOfResidence: z.enum(KGP_HALLS, {
 errorMap: () => ({ message: 'Invalid hall of residence' }),
 }),
 photoPaths: z
 .array(z.string())
 .min(1, 'At least 1 photo is required')
 .max(4, 'Maximum 4 photos allowed'),
});

export type ListingFormInput = z.infer<typeof listingSchema>;
