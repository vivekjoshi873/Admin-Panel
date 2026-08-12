import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { authApi } from '@/features/auth/api';
import { useState } from 'react';

function renderFieldLabel(label: string) {
  return <span className="text-sm text-[var(--muted)]">{label}</span>;
}

export function ProfilePage() {
  const profileQuery = useQuery({ queryKey: ['auth', 'profile'], queryFn: authApi.profile });

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const changePassword = useMutation({
    mutationFn: async () => {
      return authApi.setPassword({ token, password: newPassword });
    },
    onSuccess: () => toast({ title: 'Password updated', tone: 'success' }),
    onError: (err) => toast({ title: 'Password update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  return (
    <div>
      <PageHeader title="Profile" description="View your current profile." />

      {profileQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-60" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : profileQuery.isError ? (
        <EmptyState title="Could not load profile" description="Try refreshing." />
      ) : !profileQuery.data ? (
        <EmptyState title="No profile" description="You might not be authenticated." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                {renderFieldLabel('Full name')}
                <div className="mt-1 text-sm font-medium">{profileQuery.data.fullName ?? profileQuery.data.email}</div>
              </div>
              <div>
                {renderFieldLabel('Email')}
                <div className="mt-1 text-sm font-medium">{profileQuery.data.email}</div>
              </div>
              <div className="sm:col-span-2">
                {renderFieldLabel('Phone')}
                <div className="mt-1 text-sm font-medium">{profileQuery.data.phone ?? '-'}</div>
              </div>
            </div>

            <div className="mt-5 text-sm text-[var(--muted)]">
              Note: profile edit endpoint is not present in the current Swagger spec.
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-5">
            <p className="text-sm font-semibold">Change password</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Use the token sent by the backend (invite/reset).</p>

            <div className="mt-4 space-y-4">
              <Input label="Token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="token-from-email" />
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars"
              />
              <Button className="w-full" loading={changePassword.isPending} disabled={!token || !newPassword} onClick={() => void changePassword.mutateAsync()}>
                Update password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
