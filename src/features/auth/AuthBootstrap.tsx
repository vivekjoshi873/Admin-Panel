import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { authApi } from '@/features/auth/api';
import { queryKeys } from '@/shared/lib/query-keys';
import { extractAuthTokens } from '@/shared/lib/auth-tokens';
import {
  readStashedAccessToken,
  readStashedRefreshToken,
  stashRefreshToken,
  useAuthStore,
} from '@/shared/stores/auth-store';

/**
 * Single-flight boot so React Strict Mode (mount → cleanup → remount)
 * cannot leave status stuck on `hydrating` and show an endless skeleton.
 */
let bootPromise: Promise<void> | null = null;

/** Call on logout so the next cold visit can boot again in the same tab. */
export function resetAuthBootstrap() {
  bootPromise = null;
}

function httpStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}

async function hydrateProfile(queryClient: ReturnType<typeof useQueryClient>) {
  const profile = await authApi.profile();
  useAuthStore.getState().setUser(profile);
  queryClient.setQueryData(queryKeys.auth.profile, profile);
}

/** The API's RefreshTokenDto requires `refreshToken` in the body — never POST `{}`. */
async function tryRefresh(): Promise<string | null> {
  const refreshToken = readStashedRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(
      '/api/v1/auth/refresh',
      { refreshToken },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const tokens = extractAuthTokens(data);
    if (!tokens.accessToken) return null;

    if (tokens.refreshToken) stashRefreshToken(tokens.refreshToken);
    useAuthStore.getState().setSession(tokens.accessToken);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

async function bootSession(queryClient: ReturnType<typeof useQueryClient>) {
  const storedAccess =
    useAuthStore.getState().accessToken ?? readStashedAccessToken();

  if (storedAccess) {
    if (!useAuthStore.getState().accessToken) {
      useAuthStore.getState().setSession(storedAccess);
    }

    try {
      await hydrateProfile(queryClient);
      useAuthStore.getState().setStatus('authenticated');
      return;
    } catch (error) {
      if (httpStatus(error) !== 401) {
        // Keep the restored session; profile can retry from the app shell.
        useAuthStore.getState().setStatus('authenticated');
        return;
      }

      const refreshed = await tryRefresh();
      if (refreshed) {
        try {
          await hydrateProfile(queryClient);
        } catch {
          // New access token is enough to stay signed in.
        }
        useAuthStore.getState().setStatus('authenticated');
        return;
      }

      useAuthStore.getState().clearSession();
      return;
    }
  }

  useAuthStore.getState().setStatus('hydrating');
  const refreshed = await tryRefresh();
  if (refreshed) {
    try {
      await hydrateProfile(queryClient);
    } catch {
      // authenticated without profile is still a valid session
    }
    useAuthStore.getState().setStatus('authenticated');
    return;
  }

  useAuthStore.getState().clearSession();
}

/**
 * Restores the session on load from localStorage, then refreshes the profile.
 * A full page reload must not require a new login while tokens are still valid.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'anonymous') return;

    if (!bootPromise) {
      bootPromise = bootSession(queryClient);
    }

    void bootPromise;
  }, [status, queryClient]);

  return <>{children}</>;
}
