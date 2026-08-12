import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { authApi } from '@/features/auth/api';
import { updateUser } from '@/features/rbac/api';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  readStashedAccessToken,
  stashAccessToken,
  stashRefreshToken,
  useAuthStore,
} from '@/shared/stores/auth-store';
import type { AuthUser } from '@/shared/types/auth';

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function emailFromJwt(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    const email = json?.email ?? json?.userEmail ?? json?.preferred_username;
    return typeof email === 'string' && email.includes('@') ? email : null;
  } catch {
    return null;
  }
}

function resolveEmail(user?: AuthUser | null, accessToken?: string | null): string | null {
  if (user?.email?.trim()) return user.email.trim();
  return emailFromJwt(accessToken ?? useAuthStore.getState().accessToken ?? readStashedAccessToken());
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const sessionUser = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const profileQuery = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: authApi.profile,
  });

  const user = profileQuery.data ?? sessionUser;
  const email = resolveEmail(user, accessToken) ?? '';

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName ?? [user?.firstName, user?.lastName].filter(Boolean).join(' '),
      phone: user?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const [editError, setEditError] = useState<string | null>(null);

  const saveProfile = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const id = String(user?.id ?? (user as { uuid?: string } | undefined)?.uuid ?? '');
      if (!id) throw new Error('Profile id missing');
      return updateUser(id, { fullName: values.fullName, phone: values.phone });
    },
    onMutate: async (values) => {
      setEditError(null);
      const previous = useAuthStore.getState().user;
      if (previous) {
        setUser({ ...previous, fullName: values.fullName, phone: values.phone ?? previous.phone });
      }
      return { previous };
    },
    onError: (err, _values, ctx) => {
      if (ctx?.previous) setUser(ctx.previous);
      setEditError(getErrorMessage(err, 'Could not update profile'));
      toast({ title: 'Profile update failed', description: getErrorMessage(err), tone: 'error' });
    },
    onSuccess: (updated) => {
      const next = { ...(user as AuthUser), ...updated, fullName: updated?.fullName ?? user?.fullName };
      setUser(next as AuthUser);
      queryClient.setQueryData(queryKeys.auth.profile, next);
      toast({ title: 'Profile updated', tone: 'success' });
    },
  });

  const changePassword = useMutation({
    mutationFn: async (values: PasswordValues) => {
      // Confirm current password when we know the account email; otherwise
      // fall through to authenticated set-password (Bearer already on the client).
      const accountEmail = resolveEmail(user, accessToken);
      if (accountEmail) {
        try {
          const verified = await authApi.verifyPassword({
            email: accountEmail,
            password: values.currentPassword,
          });
          if (verified.accessToken) {
            useAuthStore.getState().setSession(verified.accessToken);
            stashAccessToken(verified.accessToken);
          }
          if (verified.refreshToken) stashRefreshToken(verified.refreshToken);
        } catch {
          throw new Error('Current password is incorrect');
        }
      }

      return authApi.setPassword({ password: values.password });
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: 'Password updated', tone: 'success' });
    },
    onError: (err) =>
      toast({
        title: 'Password update failed',
        description: getErrorMessage(err, 'Check your current password'),
        tone: 'error',
      }),
  });

  return (
    <div>
      <PageHeader
        title="Profile"
        description="View and edit your account. Password change uses your current password when possible."
      />

      {profileQuery.isLoading && !user ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-60" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !user ? (
        <EmptyState title="No profile" description="You might not be authenticated." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/75 p-5"
            onSubmit={profileForm.handleSubmit((values) => saveProfile.mutate(values))}
          >
            <p className="font-semibold">Account</p>
            <Input label="Email" value={email || '—'} disabled />
            <Input
              label="Full name"
              error={profileForm.formState.errors.fullName?.message}
              {...profileForm.register('fullName')}
            />
            <Input
              label="Phone"
              error={profileForm.formState.errors.phone?.message}
              {...profileForm.register('phone')}
            />
            {editError ? <p className="text-sm text-[var(--danger)]">{editError}</p> : null}
            <Button type="submit" loading={saveProfile.isPending}>
              Save profile
            </Button>
          </form>

          <form
            className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/75 p-5"
            onSubmit={passwordForm.handleSubmit((values) => changePassword.mutate(values))}
          >
            <p className="font-semibold">Change password</p>
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <Button type="submit" className="w-full" loading={changePassword.isPending}>
              Update password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
