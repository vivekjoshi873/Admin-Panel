import { api } from '@/shared/api/client';
import { extractAuthTokens } from '@/shared/lib/auth-tokens';
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  MessageResponse,
} from '@/shared/types/auth';

function unwrapUser(payload: unknown): AuthUser {
  const raw = payload as Record<string, unknown>;
  const nested = (raw?.data as Record<string, unknown> | undefined) ?? raw;
  const user = (nested?.user ?? nested) as AuthUser;
  return {
    ...user,
    roles: user.roles ?? [],
    permissions: normalizePermissions(user),
  };
}

function normalizePermissions(user: AuthUser): string[] {
  if (Array.isArray(user.permissions) && user.permissions.length) {
    return user.permissions
      .map((p) => (typeof p === 'string' ? p : ((p as { slug?: string }).slug ?? '')))
      .filter(Boolean);
  }

  const fromRoles =
    user.roles?.flatMap((role) => {
      const withPerms = role as { permissions?: Array<string | { slug: string }> };
      return (withPerms.permissions ?? []).map((p) => (typeof p === 'string' ? p : p.slug));
    }) ?? [];

  return [...new Set(fromRoles.filter(Boolean))];
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post('/api/v1/auth/login', payload);
    const tokens = extractAuthTokens(data);
    const body = (data?.data ?? data) as Record<string, unknown>;
    const userRaw = (body?.user ?? (data as { user?: unknown })?.user) as AuthUser | undefined;

    return {
      accessToken: tokens.accessToken ?? '',
      refreshToken: tokens.refreshToken,
      user: userRaw ? unwrapUser(userRaw) : undefined,
      expiresIn: (body?.expiresIn ?? body?.expires_in) as number | undefined,
    };
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

  async forgotPassword(email: string): Promise<MessageResponse> {
    const { data } = await api.post('/api/v1/auth/forgot-password', { email });
    return data?.data ?? data;
  },

  async resetPassword(input: { token: string; password: string }): Promise<MessageResponse> {
    const { data } = await api.post('/api/v1/auth/reset-password', input);
    return data?.data ?? data;
  },

  async setPassword(input: { token: string; password: string }): Promise<MessageResponse> {
    const { data } = await api.post('/api/v1/auth/set-password', input);
    return data?.data ?? data;
  },
};
