import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { queryKeys } from '@/shared/lib/query-keys';
import { getErrorMessage } from '@/shared/lib/cn';
import {
  clearStashedRefreshToken,
  stashRefreshToken,
  useAuthStore,
} from '@/shared/stores/auth-store';
import { toast } from '@/shared/stores/toast-store';
import type { LoginFormValues } from './schemas';

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (values: LoginFormValues) => authApi.login(values),
    onSuccess: async (data) => {
      setSession(data.accessToken, data.user ?? null);
      if (data.refreshToken) stashRefreshToken(data.refreshToken);

      if (!data.user) {
        try {
          const profile = await authApi.profile();
          useAuthStore.getState().setUser(profile);
          queryClient.setQueryData(queryKeys.auth.profile, profile);
        } catch {
          // session is still valid; profile hydrate will retry on layout mount
        }
      } else {
        queryClient.setQueryData(queryKeys.auth.profile, data.user);
      }

      toast({ title: 'Signed in', tone: 'success' });
      navigate('/', { replace: true });
    },
    onError: (error) => {
      toast({
        title: 'Sign-in failed',
        description: getErrorMessage(error, 'Check your email and password'),
        tone: 'error',
      });
    },
  });
}

export function useProfileQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: authApi.profile,
    enabled,
    staleTime: 60_000,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return count < 2;
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async (everywhere: boolean) => {
      if (everywhere) await authApi.logoutAll();
      else await authApi.logout();
    },
    onSettled: () => {
      clearSession();
      clearStashedRefreshToken();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
    onSuccess: () => toast({ title: 'Signed out', tone: 'info' }),
    onError: () => {
      // Local session is cleared in onSettled regardless — network blips shouldn't trap the user.
      toast({
        title: 'Signed out locally',
        description: 'Server logout may not have completed',
        tone: 'info',
      });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () =>
      toast({
        title: 'Check your inbox',
        description: 'If that email exists, a reset link is on the way',
        tone: 'success',
      }),
    onError: (error) =>
      toast({
        title: 'Could not send reset email',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (input: { token: string; password: string }) => authApi.resetPassword(input),
    onSuccess: () => {
      toast({ title: 'Password updated', tone: 'success' });
      navigate('/login', { replace: true });
    },
    onError: (error) =>
      toast({
        title: 'Reset failed',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}

export function useSetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (input: { token: string; password: string }) => authApi.setPassword(input),
    onSuccess: () => {
      toast({ title: 'Password set — you can sign in now', tone: 'success' });
      navigate('/login', { replace: true });
    },
    onError: (error) =>
      toast({
        title: 'Could not set password',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}
