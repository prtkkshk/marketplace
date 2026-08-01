import { z } from 'zod';
import { ALLOWED_EMAIL_DOMAIN } from '../constants';

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .refine(
    (email) => email.endsWith(ALLOWED_EMAIL_DOMAIN),
    `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`
  );

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
