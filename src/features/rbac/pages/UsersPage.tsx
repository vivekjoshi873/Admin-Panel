import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { isForbidden } from '@/shared/lib/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  getRoles,
  listUsers,
  getUserRoles,
  assignUserRoles,
  createUser,
  updateUser,
  deleteUser,
} from '../api';
import { UserRolesModal } from '../components/UserRolesModal';
import { UserFormModal } from '../components/UserFormModal';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { useAuthStore } from '@/shared/stores/auth-store';
import type { UserCreateValues, UserUpdateValues } from '../schemas';

function userId(u: { id?: string; uuid?: string }) {
  return String(u.id ?? u.uuid ?? '');
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const canCreate = useAuthStore((s) => s.hasPermission('user.create'));
  const canUpdate = useAuthStore((s) => s.hasPermission('user.update'));
  const canDelete = useAuthStore((s) => s.hasPermission('user.delete'));

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const usersQuery = useQuery({
    queryKey: ['users', { page, limit, search: debouncedSearch }],
    queryFn: () => listUsers({ page, limit, search: debouncedSearch || undefined }),
  });

  const rolesQuery = useQuery({ queryKey: ['roles', 'list'], queryFn: getRoles });

  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [activeUser, setActiveUser] = useState<any>(null);
  const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);

  const roles = (rolesQuery.data ?? []).map((r: any) => ({
    id: String(r.id ?? r.uuid),
    name: String(r.name),
    slug: r.slug,
  }));

  const createMutation = useMutation({
    mutationFn: (values: UserCreateValues) =>
      createUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        roleIds: values.roleIds,
      }),
    onSuccess: async () => {
      toast({ title: 'User created', tone: 'success' });
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast({ title: 'Create failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UserUpdateValues) => updateUser(userId(activeUser), values),
    onSuccess: async () => {
      toast({ title: 'User updated', tone: 'success' });
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast({ title: 'Update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async () => {
      toast({ title: 'User deleted', tone: 'info' });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast({ title: 'Delete failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const rolesMutation = useMutation({
    mutationFn: async (payload: { userId: string; roleIds: string[] }) =>
      assignUserRoles(payload.userId, { roleIds: payload.roleIds }),
    onSuccess: async () => {
      toast({ title: 'Roles updated', tone: 'success' });
      setRolesModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast({ title: 'Update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const userRolesQuery = useMutation({
    mutationFn: async (id: string) => getUserRoles(id),
    onSuccess: (roleIds) => {
      setInitialRoleIds(roleIds.map(String));
      setRolesModalOpen(true);
    },
    onError: (err) => toast({ title: 'Could not load roles', description: getErrorMessage(err), tone: 'error' }),
  });

  const usersBody = usersQuery.data ?? {};
  const users = Array.isArray(usersBody)
    ? usersBody
    : Array.isArray(usersBody?.data)
      ? usersBody.data
      : (usersBody?.items ?? []);

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search users, create accounts, and assign roles."
        actions={
          canCreate ? (
            <Button
              onClick={() => {
                setFormMode('create');
                setActiveUser(null);
                setFormOpen(true);
              }}
            >
              Create user
            </Button>
          ) : null
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
      ) : usersQuery.isError && isForbidden(usersQuery.error) ? (
        <ForbiddenState error={usersQuery.error} fallback="user.view" />
      ) : usersQuery.isError ? (
        <EmptyState title="Could not load users" description="Try refreshing or check your network." />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users"
          description="Try changing search, or create a user."
          actionLabel={canCreate ? 'Create user' : undefined}
          onAction={
            canCreate
              ? () => {
                  setFormMode('create');
                  setActiveUser(null);
                  setFormOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/60">
          <div className="hidden sm:grid sm:grid-cols-[1fr_160px_260px] sm:gap-2 sm:bg-[var(--surface)] sm:px-4 sm:py-3">
            <div className="text-sm font-semibold">User</div>
            <div className="text-sm font-semibold">Status</div>
            <div className="text-sm font-semibold text-right">Actions</div>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {users.map((u: any) => {
              const fullName = u.fullName ?? u.name ?? u.email;
              const status = u.status ?? (u.isActive ? 'ACTIVE' : 'INACTIVE');
              const id = userId(u);
              return (
                <div
                  key={id || u.email}
                  className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_160px_260px] sm:items-center sm:gap-2"
                >
                  <div>
                    <p className="font-medium">{fullName}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{u.email ?? '-'}</p>
                  </div>
                  <div className="text-sm text-[var(--muted)]">{status}</div>
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canUpdate}
                      onClick={() => {
                        setActiveUser(u);
                        userRolesQuery.mutate(id);
                      }}
                    >
                      Roles
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canUpdate}
                      onClick={() => {
                        setFormMode('edit');
                        setActiveUser(u);
                        setFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <ConfirmDelete
                      label="Delete"
                      title="Delete user?"
                      description="This removes the user account."
                      disabled={!canDelete}
                      onConfirm={() => deleteMutation.mutateAsync(id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <UserRolesModal
        open={rolesModalOpen}
        roles={roles}
        initialRoleIds={initialRoleIds}
        onClose={() => setRolesModalOpen(false)}
        isPending={rolesMutation.isPending}
        onSubmit={(roleIds) => {
          rolesMutation.mutate({ userId: userId(activeUser), roleIds });
        }}
      />

      <UserFormModal
        open={formOpen}
        mode={formMode}
        initial={
          activeUser
            ? {
                fullName: activeUser.fullName ?? activeUser.name,
                email: activeUser.email,
                phone: activeUser.phone,
                isActive: activeUser.isActive,
              }
            : null
        }
        roles={roles}
        onClose={() => setFormOpen(false)}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => {
          if (formMode === 'create') return createMutation.mutateAsync(values as UserCreateValues);
          return updateMutation.mutateAsync(values as UserUpdateValues);
        }}
      />
    </div>
  );
}
