import { z } from 'zod';

const emailField = z.string().trim().min(1, 'Email is required').email('Enter a valid email');
const otpField = z
  .string()
  .trim()
  .min(6, 'Enter the 6-digit code')
  .max(6, 'Enter the 6-digit code')
  .regex(/^\d{6}$/, 'OTP must be 6 digits');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetOtpSchema = z.object({
  email: emailField,
  otp: otpField,
});

export type ResetOtpFormValues = z.infer<typeof resetOtpSchema>;

/** Step 2 — new password only (OTP already collected). */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/** Authenticated set/change password (Bearer) — no invite token. */
export const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    email: emailField,
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    phone: z.string().trim().optional(),
    countryId: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const otpVerifySchema = z.object({
  email: emailField,
  otp: otpField,
});

export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;

export const emailOnlySchema = z.object({
  email: emailField,
});

export type EmailOnlyFormValues = z.infer<typeof emailOnlySchema>;
