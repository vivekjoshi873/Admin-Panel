import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { getRoles, listUsers, getUserRoles, assignUserRoles } from '../api';
import { UserRolesModal } from '../components/UserRolesModal';
import { useAuthStore } from '@/shared/stores/auth-store';

export function UsersPage() {
  const queryClient = useQueryClient();

  const canRead = useAuthStore((s) => s.hasPermission('users.read'));
  const canUpdate = useAuthStore((s) => s.hasPermission('users.update'));

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const usersQuery = useQuery<any>({
    queryKey: ['users', { page, limit, search }],
    queryFn: () => listUsers({ page, limit, search }),
  });

  const rolesQuery = useQuery({ queryKey: ['roles', 'list'], queryFn: getRoles });

  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);

  const rolesMutation = useMutation({
    mutationFn: async (payload: { userId: string; roleIds: string[] }) =>
      assignUserRoles(payload.userId, { roleIds: payload.roleIds } as any),
    onSuccess: async () => {
      toast({ title: 'Roles updated', tone: 'success' });
      setRolesModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast({ title: 'Update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const userRolesQuery = useMutation({
    mutationFn: async (userId: string) => getUserRoles(userId),
    onSuccess: (roleIds) => {
      setInitialRoleIds(roleIds);
      setRolesModalOpen(true);
    },
    onError: (err) => toast({ title: 'Could not load roles', description: getErrorMessage(err), tone: 'error' }),
  });

  if (!canRead) {
    return <EmptyState title="No access" description="You don?t have permission to view users." />;
  }

  const usersBody = usersQuery.data ?? {};
  const users = Array.isArray(usersBody)
    ? usersBody
    : Array.isArray(usersBody?.data)
      ? usersBody.data
      : usersBody?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search users and assign roles."
        actions={
          canUpdate ? null : null
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-72">
          <label className="text-sm text-[var(--muted)]">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            placeholder="Name or email"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </Button>
          <Button variant="secondary" size="sm" disabled={users.length < limit} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      {usersQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : usersQuery.isError ? (
        <EmptyState title="Could not load users" description="Try refreshing or check your network." />
      ) : users.length === 0 ? (
        <EmptyState title="No users" description="Try changing filters or create a user via the backend." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/60">
          <div className="hidden sm:grid sm:grid-cols-[1fr_160px_190px] sm:gap-2 sm:bg-[var(--surface)] sm:px-4 sm:py-3">
            <div className="text-sm font-semibold">User</div>
            <div className="text-sm font-semibold">Status</div>
            <div className="text-sm font-semibold text-right">Actions</div>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {users.map((u: any) => {
              const fullName = u.fullName ?? u.name ?? u.email;
              const status = u.status ?? (u.isActive ? 'ACTIVE' : 'INACTIVE');
              return (
                <div
                  key={u.id ?? u.uuid}
                  className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_160px_190px] sm:items-center sm:gap-2"
                >
                  <div>
                    <p className="font-medium">{fullName}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{u.email ?? '-'}</p>
                  </div>
                  <div className="text-sm text-[var(--muted)]">{status}</div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canUpdate}
                      onClick={() => {
                        const userId = String(u.id ?? u.uuid);
                        setActiveUserId(userId);
                        userRolesQuery.mutate(userId);
                      }}
                    >
                      Edit roles
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <UserRolesModal
        open={rolesModalOpen}
        roles={(rolesQuery.data ?? []).map((r: any) => ({ id: String(r.id), name: String(r.name), slug: r.slug }))}
        initialRoleIds={initialRoleIds.map(String)}
        onClose={() => setRolesModalOpen(false)}
        isPending={rolesMutation.isPending}
        onSubmit={(roleIds) => {
          rolesMutation.mutate({ userId: activeUserId, roleIds });
        }}
      />
    </div>
  );
}
