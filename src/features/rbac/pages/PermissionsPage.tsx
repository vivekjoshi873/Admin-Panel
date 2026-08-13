import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { PermissionFormModal } from '../components/PermissionFormModal';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { isForbidden } from '@/shared/lib/permissions';
import { getPermissionsModules, createPermission, updatePermission, deletePermission } from '../api';

function permissionId(p: { id?: string; uuid?: string }) {
  return String(p.id ?? p.uuid ?? '');
}

export function PermissionsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['permissions', 'modules'],
    queryFn: getPermissionsModules,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [initial, setInitial] = useState<any>(null);

  const flatPermissions = useMemo(() => {
    const groups = data ?? [];
    const perms: any[] = [];
    for (const g of groups) {
      for (const p of g.permissions ?? []) {
        perms.push({ ...p, module: g.module });
      }
    }
    return perms;
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (values: any) => createPermission(values),
    onSuccess: () => {
      toast({ title: 'Permission created', tone: 'success' });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setModalOpen(false);
    },
    onError: (err) => toast({ title: 'Create failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { permissionId: string; values: any }) =>
      updatePermission(vars.permissionId, vars.values),
    onSuccess: () => {
      toast({ title: 'Permission updated', tone: 'success' });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setModalOpen(false);
    },
    onError: (err) => toast({ title: 'Update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePermission(id),
    onSuccess: () => {
      toast({ title: 'Permission deleted', tone: 'info' });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (err) => toast({ title: 'Delete failed', description: getErrorMessage(err), tone: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="Permissions"
        description="Permissions are grouped by module; use the matrix to assign them to roles."
        actions={
          <Button
            onClick={() => {
              setMode('create');
              setInitial(null);
              setModalOpen(true);
            }}
          >
            Create permission
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError && isForbidden(error) ? (
        <ForbiddenState error={error} fallback="permission.view" />
      ) : isError ? (
        <EmptyState title="Could not load permissions" description="Try refreshing or check your network." />
      ) : flatPermissions.length === 0 ? (
        <EmptyState
          title="No permissions yet"
          description="Create permissions before assigning them to roles."
          actionLabel="Create permission"
          onAction={() => {
            setMode('create');
            setInitial(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/60">
          <div className="hidden sm:grid sm:grid-cols-[1fr_200px_160px] sm:gap-2 sm:bg-[var(--surface)] sm:px-4 sm:py-3">
            <div className="text-sm font-semibold">Permission</div>
            <div className="text-sm font-semibold">Module</div>
            <div className="text-sm font-semibold text-right">Actions</div>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {flatPermissions
              .sort((a, b) => String(a.module).localeCompare(String(b.module)))
              .map((p: any) => (
                <div
                  key={permissionId(p) || p.slug}
                  className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_200px_160px] sm:items-center sm:gap-2"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{p.slug ?? '-'}</p>
                  </div>
                  <div className="text-sm text-[var(--muted)]">{p.module ?? '-'}</div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setMode('edit');
                        setInitial(p);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <ConfirmDelete
                      label="Delete"
                      title="Delete permission?"
                      description="This will remove the permission from all roles."
                      onConfirm={() => deleteMutation.mutateAsync(permissionId(p))}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <PermissionFormModal
        open={modalOpen}
        mode={mode}
        initial={initial}
        onClose={() => setModalOpen(false)}
        onSubmit={(values) => {
          if (mode === 'create') return createMutation.mutateAsync(values);
          return updateMutation.mutateAsync({ permissionId: permissionId(initial), values });
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
