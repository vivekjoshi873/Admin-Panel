import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { RoleFormModal } from '../components/RoleFormModal';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { getRoles, createRole, updateRole, deleteRole } from '../api';
import { useAuthStore } from '@/shared/stores/auth-store';

export function RolesPage() {
  const queryClient = useQueryClient();
  const canRead = useAuthStore((s) => s.hasPermission('roles.read'));
  const canCreate = useAuthStore((s) => s.hasPermission('roles.create'));

  const { data: roles, isLoading, isError } = useQuery({
    queryKey: ['roles', 'list'],
    queryFn: getRoles,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [initial, setInitial] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (values: any) => createRole(values),
    onSuccess: () => {
      toast({ title: 'Role created', tone: 'success' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setModalOpen(false);
    },
    onError: (err) => toast({ title: 'Create failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { roleId: string; values: any }) => updateRole(vars.roleId, vars.values),
    onSuccess: () => {
      toast({ title: 'Role updated', tone: 'success' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setModalOpen(false);
    },
    onError: (err) => toast({ title: 'Update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: () => {
      toast({ title: 'Role deleted', tone: 'info' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => toast({ title: 'Delete failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const selectedSubmit = (values: any) => {
    if (mode === 'create') return createMutation.mutateAsync(values);
    if (!initial?.id) return;
    return updateMutation.mutateAsync({ roleId: initial.id, values });
  };

  const sortedRoles = useMemo(() => {
    return roles
      ? [...roles].sort((a: any, b: any) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
      : [];
  }, [roles]);

  if (!canRead) {
    return (
      <EmptyState title="No access" description="You don?t have permission to view roles." />
    );
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Manage roles and permissions visibility across the admin UI."
        actions={
          canCreate ? (
            <Button onClick={() => {
              setMode('create');
              setInitial(null);
              setModalOpen(true);
            }}>
              Create role
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title="Could not load roles" description="Try refreshing or check your network." />
      ) : sortedRoles.length === 0 ? (
        <EmptyState title="No roles yet" description="Create your first role to start assigning permissions." actionLabel="Create role" onAction={() => {
          setMode('create');
          setInitial(null);
          setModalOpen(true);
        }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/60">
          <div className="hidden sm:grid sm:grid-cols-[1fr_180px_160px] sm:gap-2 sm:bg-[var(--surface)] sm:px-4 sm:py-3">
            <div className="text-sm font-semibold">Role</div>
            <div className="text-sm font-semibold">Slug</div>
            <div className="text-sm font-semibold text-right">Actions</div>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {sortedRoles.map((r: any) => (
              <div
                key={r.id}
                className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_180px_160px] sm:items-center sm:gap-2"
              >
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.description ? <p className="mt-0.5 text-xs text-[var(--muted)]">{r.description}</p> : null}
                </div>
                <div className="text-sm text-[var(--muted)]">{r.slug ?? '-'}</div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={updateMutation.isPending}
                    disabled={!useAuthStore.getState().hasPermission('roles.update')}
                    onClick={() => {
                      setMode('edit');
                      setInitial(r);
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>

                  <ConfirmDelete
                    label="Delete"
                    title="Delete role?"
                    description="This will remove the role from the system."
                    disabled={!useAuthStore.getState().hasPermission('roles.delete')}
                    dangerLabel="Delete"
                    onConfirm={() => deleteMutation.mutateAsync(r.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RoleFormModal
        open={modalOpen}
        mode={mode}
        initial={initial}
        onClose={() => setModalOpen(false)}
        onSubmit={(values) => selectedSubmit(values)}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
