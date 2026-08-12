import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { queryKeys } from '@/shared/lib/query-keys';
import { getErrorMessage } from '@/shared/lib/cn';
import {
  clearStashedAccessToken,
  clearStashedRefreshToken,
  stashAccessToken,
  stashRefreshToken,
  useAuthStore,
} from '@/shared/stores/auth-store';
import { toast } from '@/shared/stores/toast-store';
import type { LoginFormValues, RegisterFormValues } from './schemas';
import { resetAuthBootstrap } from './AuthBootstrap';
import { clearPendingEmail, stashPendingEmail, stashPendingResetToken } from './pending-email';
import type { LoginResponse } from '@/shared/types/auth';

async function establishSession(
  data: LoginResponse,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (!data.accessToken) {
    throw new Error('Response did not include an access token');
  }

  useAuthStore.getState().setSession(data.accessToken, data.user ?? null);
  stashAccessToken(data.accessToken);
  if (data.refreshToken) stashRefreshToken(data.refreshToken);

  if (!data.user) {
    try {
      const profile = await authApi.profile();
      useAuthStore.getState().setUser(profile);
      queryClient.setQueryData(queryKeys.auth.profile, profile);
    } catch {
      // session is still valid
    }
  } else {
    queryClient.setQueryData(queryKeys.auth.profile, data.user);
  }

  clearPendingEmail();
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginFormValues) => authApi.login(values),
    onSuccess: async (data) => {
      try {
        await establishSession(data, queryClient);
        toast({ title: 'Signed in', tone: 'success' });
        navigate(data.requiresPasswordSetup ? '/set-password' : '/', { replace: true });
      } catch (error) {
        toast({
          title: 'Sign-in failed',
          description: getErrorMessage(error, 'Login response did not include an access token'),
          tone: 'error',
        });
      }
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
      clearStashedAccessToken();
      clearPendingEmail();
      resetAuthBootstrap();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
    onSuccess: () => toast({ title: 'Signed out', tone: 'info' }),
    onError: () => {
      toast({
        title: 'Signed out locally',
        description: 'Server logout may not have completed',
        tone: 'info',
      });
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        countryId: values.countryId || undefined,
      }),
    onSuccess: (data, values) => {
      stashPendingEmail(values.email, 'email-verify');
      toast({
        title: 'Check your email',
        description: data.message ?? 'A verification code was sent',
        tone: 'success',
      });
      navigate(`/verify-otp?email=${encodeURIComponent(values.email)}&purpose=email-verify`, {
        replace: true,
      });
    },
    onError: (error) =>
      toast({
        title: 'Registration failed',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}

export function useSendEmailOtp() {
  return useMutation({
    mutationFn: (email: string) => authApi.sendEmailOtp(email),
    onSuccess: (data) =>
      toast({
        title: 'Code sent',
        description: data.message ?? `Valid for ${data.expiresInMinutes ?? 10} minutes`,
        tone: 'success',
      }),
    onError: (error) =>
      toast({
        title: 'Could not send code',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}

export function useResendEmailOtp() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendEmailOtp(email),
    onSuccess: (data) =>
      toast({
        title: 'Code resent',
        description: data.message ?? `Valid for ${data.expiresInMinutes ?? 10} minutes`,
        tone: 'success',
      }),
    onError: (error) =>
      toast({
        title: 'Could not resend code',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}

export function useVerifyEmailOtp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; otp: string }) => authApi.verifyEmailOtp(input),
    onSuccess: async (data) => {
      try {
        await establishSession(data, queryClient);
        toast({ title: 'Email verified', tone: 'success' });
        navigate(data.requiresPasswordSetup ? '/set-password' : '/', { replace: true });
      } catch (error) {
        toast({
          title: 'Verification failed',
          description: getErrorMessage(error),
          tone: 'error',
        });
      }
    },
    onError: (error) =>
      toast({
        title: 'Invalid or expired code',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: (data, email) => {
      stashPendingEmail(email, 'reset-password');
      if (data.token) stashPendingResetToken(data.token);
      toast({
        title: 'Check your inbox',
        description: 'Open the reset link in the email, then enter the 6-digit code',
        tone: 'success',
      });
    },
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
    mutationFn: (input: {
      token: string;
      otp: string;
      password: string;
      confirmPassword: string;
    }) => authApi.resetPassword(input),
    onSuccess: () => {
      clearPendingEmail();
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
  const status = useAuthStore((s) => s.status);

  return useMutation({
    mutationFn: (input: { password: string }) => authApi.setPassword(input),
    onSuccess: () => {
      toast({ title: 'Password saved', description: 'You can use email + password next time', tone: 'success' });
      navigate(status === 'authenticated' ? '/' : '/login', { replace: true });
    },
    onError: (error) =>
      toast({
        title: 'Could not set password',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });
}
