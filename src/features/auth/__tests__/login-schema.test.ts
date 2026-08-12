import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  otpVerifySchema,
  resetOtpSchema,
  resetPasswordSchema,
  setPasswordSchema,
} from '../schemas';

describe('loginSchema', () => {
  it('accepts a normal email/password pair', () => {
    const parsed = loginSchema.safeParse({
      email: 'admin@bingo.dev',
      password: 'secret12',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty password with a field error', () => {
    const parsed = loginSchema.safeParse({
      email: 'admin@bingo.dev',
      password: '',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.password?.[0]).toMatch(/required/i);
    }
  });

  it('rejects malformed email', () => {
    const parsed = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret12',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('resetOtpSchema', () => {
  it('requires a 6-digit OTP', () => {
    expect(resetOtpSchema.safeParse({ email: 'a@b.com', otp: '12' }).success).toBe(false);
    expect(resetOtpSchema.safeParse({ email: 'a@b.com', otp: '123456' }).success).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  it('flags mismatched confirmation', () => {
    const parsed = resetPasswordSchema.safeParse({
      password: 'longenough',
      confirmPassword: 'different1',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/match/i);
    }
  });
});

describe('otpVerifySchema', () => {
  it('accepts email + 6-digit otp', () => {
    expect(otpVerifySchema.safeParse({ email: 'a@b.com', otp: '123456' }).success).toBe(true);
  });
});

describe('setPasswordSchema', () => {
  it('does not require an invite token', () => {
    expect(
      setPasswordSchema.safeParse({
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }).success,
    ).toBe(true);
  });
});
