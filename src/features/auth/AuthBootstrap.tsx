import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { authApi } from '@/features/auth/api';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  readStashedRefreshToken,
  stashRefreshToken,
  useAuthStore,
} from '@/shared/stores/auth-store';

/**
 * Boots the session once on app load.
 * - If we already have an access token in memory (soft navigation), fetch profile.
 * - Otherwise attempt a silent refresh via cookie/sessionStorage; failure => anonymous.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setStatus = useAuthStore((s) => s.setStatus);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== 'idle') return;

    let cancelled = false;

    async function hydrate() {
      setStatus('hydrating');
      try {
        if (accessToken) {
          const profile = await authApi.profile();
          if (cancelled) return;
          setUser(profile);
          setStatus('authenticated');
          queryClient.setQueryData(queryKeys.auth.profile, profile);
          return;
        }

        const body: Record<string, string> = {};
        const stashed = readStashedRefreshToken();
        if (stashed) body.refreshToken = stashed;

        const { data } = await api.post(
          '/api/v1/auth/refresh',
          Object.keys(body).length ? body : undefined,
        );
        const payload = data?.data ?? data;
        const token = payload?.accessToken ?? payload?.access_token ?? payload?.token;
        if (!token) throw new Error('no token');

        if (payload?.refreshToken) stashRefreshToken(payload.refreshToken);
        if (cancelled) return;

        setSession(token);
        const profile = await authApi.profile();
        if (cancelled) return;
        setUser(profile);
        queryClient.setQueryData(queryKeys.auth.profile, profile);
        setStatus('authenticated');
      } catch {
        if (!cancelled) clearSession();
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [
    status,
    accessToken,
    setStatus,
    setSession,
    setUser,
    clearSession,
    queryClient,
  ]);

  return <>{children}</>;
}
