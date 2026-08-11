import { describe, expect, it } from 'vitest';
import { loginSchema, resetPasswordSchema } from '../schemas';

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

describe('resetPasswordSchema', () => {
  it('flags mismatched confirmation', () => {
    const parsed = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'longenough',
      confirmPassword: 'different1',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/match/i);
    }
  });
});
