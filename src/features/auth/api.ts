import axios from 'axios';
import { api } from '@/shared/api/client';
import { extractAuthTokens } from '@/shared/lib/auth-tokens';
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  MessageResponse,
} from '@/shared/types/auth';
import { flattenRoles } from '@/shared/lib/roles';

export function unwrapUser(payload: unknown): AuthUser {
  const raw = payload as Record<string, unknown>;
  const nested = (raw?.data as Record<string, unknown> | undefined) ?? raw;
  const nestedUser =
    nested?.user && typeof nested.user === 'object'
      ? (nested.user as Record<string, unknown>)
      : null;

  // Prefer the object that actually carries identity fields (email / uuid).
  // Some envelopes include an empty `user` key that would otherwise win via `??`.
  const source =
    nestedUser && (nestedUser.email || nestedUser.uuid || nestedUser.id)
      ? nestedUser
      : nested;

  const user = source as AuthUser;
  const rawRoles = (source as { roles?: unknown }).roles;
  const roles = flattenRoles(rawRoles);
  const email = String(
    (source as { email?: unknown }).email ??
      (source as { userEmail?: unknown }).userEmail ??
      (nested as { email?: unknown })?.email ??
      '',
  );

  return {
    ...user,
    id: String((user as { id?: string; uuid?: string }).id ?? (user as { uuid?: string }).uuid ?? ''),
    email,
    roles,
    // Collect slugs from top-level permissions AND raw role joins (before flatten strips them).
    permissions: collectPermissionSlugs(
      (source as { permissions?: unknown }).permissions,
      rawRoles,
    ),
  };
}

function permissionSlug(entry: unknown): string {
  if (entry == null) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'number') return String(entry);
  const row = entry as {
    slug?: string;
    permission?: { slug?: string };
    name?: string;
  };
  return String(row.slug ?? row.permission?.slug ?? '').trim();
}

/** Merge direct permission list with permissions nested under role / role.permissions. */
export function collectPermissionSlugs(direct: unknown, rolesRaw: unknown): string[] {
  const slugs = new Set<string>();

  if (Array.isArray(direct)) {
    for (const p of direct) {
      const slug = permissionSlug(p);
      if (slug) slugs.add(slug);
    }
  }

  if (Array.isArray(rolesRaw)) {
    for (const entry of rolesRaw) {
      const row = entry as {
        permissions?: unknown;
        role?: { permissions?: unknown };
      };
      const nested = row.role?.permissions ?? row.permissions;
      if (!Array.isArray(nested)) continue;
      for (const p of nested) {
        const slug = permissionSlug(p);
        if (slug) slugs.add(slug);
      }
    }
  }

  return [...slugs];
}

/** Normalize login / verify-otp payloads into one shape. */
export function parseSessionPayload(raw: unknown): LoginResponse {
  const root = (raw ?? {}) as Record<string, unknown>;
  const body = (root.data as Record<string, unknown> | undefined) ?? root;
  const tokens = extractAuthTokens(raw);
  const userRaw = (body.user ?? root.user) as AuthUser | undefined;

  return {
    accessToken: tokens.accessToken ?? '',
    refreshToken: tokens.refreshToken,
    user: userRaw ? unwrapUser(userRaw) : undefined,
    expiresIn: (body.expiresIn ?? body.expires_in) as number | undefined,
    requiresPasswordSetup: Boolean(body.requiresPasswordSetup ?? root.requiresPasswordSetup),
    message: String(root.message ?? body.message ?? '') || undefined,
  };
}

export type OtpSendResponse = {
  message?: string;
  email?: string;
  expiresInMinutes?: number;
};

export type UserExistsResponse = {
  exists?: boolean;
  hasLocalProfile?: boolean;
  checked?: boolean;
  [key: string]: unknown;
};

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post('/api/v1/auth/login', payload);
    return parseSessionPayload(data);
  },

  /** Login on a raw client so a wrong password does not clear the current session. */
  async verifyPassword(payload: LoginPayload): Promise<LoginResponse> {
    const rawBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
    const baseURL = import.meta.env.DEV ? '' : rawBase;
    const { data } = await axios.post(`${baseURL}/api/v1/auth/login`, payload, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return parseSessionPayload(data);
  },

  async profile(): Promise<AuthUser> {
    const { data } = await api.get('/api/v1/auth/profile');
    return unwrapUser(data);
  },

  async logout(): Promise<void> {
    await api.post('/api/v1/auth/logout');
  },

  async logoutAll(): Promise<void> {
    await api.post('/api/v1/auth/logout-all');
  },

  async register(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    countryId?: string;
  }): Promise<OtpSendResponse> {
    const { data } = await api.post('/api/v1/auth/register', input);
    const body = (data?.data ?? data) as OtpSendResponse;
    return {
      message: data?.message ?? body.message,
      email: body.email ?? input.email,
      expiresInMinutes: body.expiresInMinutes,
    };
  },

  async userExists(email: string): Promise<UserExistsResponse> {
    const { data } = await api.post('/api/v1/auth/user-exists', { email });
    return (data?.data ?? data) as UserExistsResponse;
  },

  async sendEmailOtp(email: string): Promise<OtpSendResponse> {
    const { data } = await api.post('/api/v1/auth/email/send-otp', { email });
    const body = (data?.data ?? data) as OtpSendResponse;
    return {
      message: data?.message ?? body.message,
      email: body.email ?? email,
      expiresInMinutes: body.expiresInMinutes,
    };
  },

  async resendEmailOtp(email: string): Promise<OtpSendResponse> {
    const { data } = await api.post('/api/v1/auth/email/resend-otp', { email });
    const body = (data?.data ?? data) as OtpSendResponse;
    return {
      message: data?.message ?? body.message,
      email: body.email ?? email,
      expiresInMinutes: body.expiresInMinutes,
    };
  },

  async verifyEmailOtp(input: { email: string; otp: string }): Promise<LoginResponse> {
    const { data } = await api.post('/api/v1/auth/email/verify-otp', input);
    return parseSessionPayload(data);
  },

  async forgotPassword(email: string): Promise<MessageResponse & { token?: string }> {
    const { data } = await api.post('/api/v1/auth/forgot-password', { email });
    const body = (data?.data ?? data) as Record<string, unknown>;
    const token =
      (typeof body?.token === 'string' && body.token) ||
      (typeof body?.resetToken === 'string' && body.resetToken) ||
      undefined;
    return {
      message: String(
        data?.message ?? body?.message ?? 'Password reset link sent successfully',
      ),
      ...(token ? { token } : {}),
    };
  },

  /**
   * Swagger ResetPasswordDto: token + otp + password + confirmPassword only.
   * Do not send email — API rejects unknown properties.
   */
  async resetPassword(input: {
    token: string;
    otp: string;
    password: string;
    confirmPassword: string;
  }): Promise<MessageResponse> {
    const { data } = await api.post('/api/v1/auth/reset-password', {
      token: input.token,
      otp: input.otp,
      password: input.password,
      confirmPassword: input.confirmPassword,
    });
    return data?.data ?? data;
  },

  /** Authenticated set/change password — body is `{ password }` only. */
  async setPassword(input: { password: string }): Promise<MessageResponse> {
    const { data } = await api.post('/api/v1/auth/set-password', { password: input.password });
    return data?.data ?? data;
  },
};
