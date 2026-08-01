import { z } from 'zod';
import { KGP_HALLS, ROLL_NUMBER_REGEX } from '../constants';

export const normalizePhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return phone.trim();
};

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(60, 'Full name must be at most 60 characters')
    .trim(),
  rollNumber: z
    .string()
    .toUpperCase()
    .regex(ROLL_NUMBER_REGEX, 'Invalid roll number format (e.g. 22CS10045)'),
  hallOfResidence: z.enum(KGP_HALLS, {
    errorMap: () => ({ message: 'Please select a valid hall of residence' }),
  }),
  whatsappNumber: z
    .string()
    .transform(normalizePhoneNumber)
    .refine(
      (val) => /^\+91[0-9]{10}$/.test(val),
      'WhatsApp number must be a valid 10-digit Indian phone number'
    ),
});

export type ProfileInput = z.infer<typeof profileSchema>;
