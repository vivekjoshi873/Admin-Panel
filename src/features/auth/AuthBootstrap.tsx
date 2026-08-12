import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { authApi } from '@/features/auth/api';
import { queryKeys } from '@/shared/lib/query-keys';
import { extractAuthTokens } from '@/shared/lib/auth-tokens';
import {
  clearStashedAccessToken,
  clearStashedRefreshToken,
  readStashedAccessToken,
  readStashedRefreshToken,
  stashAccessToken,
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

async function restoreWithAccessToken(
  accessToken: string,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  useAuthStore.getState().setSession(accessToken);
  const profile = await authApi.profile();
  useAuthStore.getState().setUser(profile);
  useAuthStore.getState().setStatus('authenticated');
  queryClient.setQueryData(queryKeys.auth.profile, profile);
  stashAccessToken(accessToken);
}

async function bootSession(queryClient: ReturnType<typeof useQueryClient>) {
  const store = useAuthStore.getState();
  store.setStatus('hydrating');

  try {
    // Soft navigation within the SPA may already have an access token.
    if (store.accessToken) {
      await restoreWithAccessToken(store.accessToken, queryClient);
      return;
    }

    const refreshToken = readStashedRefreshToken();

    // 1) Prefer refresh (body token and/or httpOnly cookie via proxy).
    try {
      const { data } = await axios.post(
        '/api/v1/auth/refresh',
        refreshToken ? { refreshToken } : {},
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const tokens = extractAuthTokens(data);
      if (tokens.accessToken) {
        if (tokens.refreshToken) stashRefreshToken(tokens.refreshToken);
        await restoreWithAccessToken(tokens.accessToken, queryClient);
        return;
      }
    } catch {
      // Fall through to access-token stash restore.
    }

    // 2) Fallback: restore from stashed access token (same browser tab reload).
    const stashedAccess = readStashedAccessToken();
    if (stashedAccess) {
      await restoreWithAccessToken(stashedAccess, queryClient);
      return;
    }

    useAuthStore.getState().clearSession();
  } catch {
    clearStashedRefreshToken();
    clearStashedAccessToken();
    useAuthStore.getState().clearSession();
  }
}

/**
 * Boots the session once on app load.
 * Access token lives in memory during the SPA session; on full reload we restore via
 * refresh token / cookie, with a sessionStorage access-token fallback for this API/proxy setup.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'authenticated' || status === 'anonymous') return;

    if (!bootPromise) {
      bootPromise = bootSession(queryClient);
    }

    void bootPromise;
  }, [status, queryClient]);

  return <>{children}</>;
}
