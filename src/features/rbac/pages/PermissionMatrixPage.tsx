import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { isForbidden } from '@/shared/lib/permissions';
import { assignRolePermissions, getPermissionsModules, getRolePermissions, getRoles } from '../api';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Input } from '@/shared/components/ui/Input';

function entityId(item: { id?: string; uuid?: string }) {
  return String(item.id ?? item.uuid ?? '');
}

export function PermissionMatrixPage() {
  const queryClient = useQueryClient();
  const canUpdate = useAuthStore((s) => s.hasPermission('role.update'));

  const [roleId, setRoleId] = useState<string>('');
  const [search, setSearch] = useState('');

  const rolesQuery = useQuery({ queryKey: ['roles', 'list'], queryFn: getRoles });
  const modulesQuery = useQuery({ queryKey: ['permissions', 'modules'], queryFn: getPermissionsModules });

  const permissionsModules = modulesQuery.data ?? [];

  const activeRoleId = roleId || entityId(rolesQuery.data?.[0] ?? {});

  // Assigned permissions for the selected role.
  const assignedQuery = useQuery({
    queryKey: ['roles', activeRoleId, 'permissions'],
    queryFn: () => getRolePermissions(activeRoleId),
    enabled: Boolean(activeRoleId),
  });

  const assigned = assignedQuery.data ?? [];
  const assignedSet = useMemo(() => new Set(assigned), [assigned]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredModules = useMemo(() => {
    if (!normalizedSearch) return permissionsModules;
    return permissionsModules
      .map((m: any) => ({
        module: m.module,
        permissions: (m.permissions ?? []).filter((p: any) => {
          const name = String(p.name ?? '').toLowerCase();
          const slug = String(p.slug ?? '').toLowerCase();
          return name.includes(normalizedSearch) || slug.includes(normalizedSearch);
        }),
      }))
      .filter((m: any) => (m.permissions ?? []).length > 0);
  }, [permissionsModules, normalizedSearch]);

  const isChecked = (perm: any) => {
    const id = perm.id ?? perm.permissionId;
    const slug = perm.slug;
    return assignedSet.has(id) || (slug ? assignedSet.has(slug) : false);
  };

  const selectAllModule = (modulePermissions: any[]) => {
    const next = new Set<string>(assigned as any);
    for (const p of modulePermissions) {
      const id = String(p.id ?? p.permissionId);
      if (id) next.add(id);
    }
    return Array.from(next);
  };

  const clearModule = (modulePermissions: any[]) => {
    const toRemove = new Set<string>();
    for (const p of modulePermissions) {
      const id = String(p.id ?? p.permissionId);
      if (id) toRemove.add(id);
    }
    return (assigned as any).filter((x: any) => !toRemove.has(String(x)));
  };

  const [draftIds, setDraftIds] = useState<string[] | null>(null);

  // If assignment query changes, reset draft.
  const effectiveAssigned = draftIds ?? (assigned as any);
  const effectiveSet = useMemo(() => new Set(effectiveAssigned ?? []), [effectiveAssigned]);

  const togglePermission = (perm: any, checked: boolean) => {
    const id = String(perm.id ?? perm.permissionId ?? '');
    if (!id) return;

    setDraftIds((prev) => {
      const base = prev ?? (assigned as any);
      const next = new Set(base.map((v: any) => String(v)));
      if (checked) next.add(id);
      else next.delete(id);
      return Array.from(next) as string[];
    });
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(effectiveSet)
        .map((x) => String(x))
        .filter(Boolean);
      await assignRolePermissions(activeRoleId, { permissionIds: ids } as any);
    },
    onSuccess: async () => {
      toast({ title: 'Permissions updated', tone: 'success' });
      setDraftIds(null);
      await queryClient.invalidateQueries({ queryKey: ['roles', activeRoleId, 'permissions'] });
      await queryClient.invalidateQueries({ queryKey: ['permissions', 'modules'] });
    },
    onError: (err) => toast({ title: 'Update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  if (rolesQuery.isError && isForbidden(rolesQuery.error)) {
    return <ForbiddenState error={rolesQuery.error} fallback="role.view" />;
  }

  if (modulesQuery.isError && isForbidden(modulesQuery.error)) {
    return <ForbiddenState error={modulesQuery.error} fallback="permission.view" />;
  }

  if (rolesQuery.isLoading || modulesQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Permission matrix" />
        <Skeleton className="h-14 w-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Permission matrix"
        description="Pick a role, then assign permissions module-by-module."
        actions={
          canUpdate ? (
            <Button loading={assignMutation.isPending} onClick={() => void assignMutation.mutateAsync()}>
              Save changes
            </Button>
          ) : null
        }
      />

      {rolesQuery.data?.length ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm text-[var(--muted)]">Role</label>
            <select
              className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              value={activeRoleId}
              onChange={(e) => {
                setRoleId(e.target.value);
                setDraftIds(null);
              }}
            >
              {rolesQuery.data.map((r: any) => (
                <option key={entityId(r)} value={entityId(r)}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-72">
            <Input label="Search permissions" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type name or slug" />
          </div>
        </div>
      ) : (
        <EmptyState title="No roles" description="Create roles first to start assigning permissions." />
      )}

      {permissionsModules.length === 0 ? (
        <EmptyState title="No permissions modules" description="Create permissions before using the matrix." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/60">
          <div className="max-h-[62vh] overflow-auto">
            {filteredModules.map((m: any) => {
              const modulePermissions = m.permissions ?? [];
              const moduleIds = modulePermissions.map((p: any) => String(p.id ?? p.permissionId)).filter(Boolean);
              const selectedInModule = moduleIds.filter((id: string) => effectiveSet.has(id));
              const allSelected = moduleIds.length > 0 && selectedInModule.length === moduleIds.length;
              const noneSelected = selectedInModule.length === 0;

              return (
                <div key={m.module} className="border-b border-[var(--line)] last:border-b-0">
                  <div className="sticky top-0 z-10 flex flex-col gap-2 bg-[var(--surface)]/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{m.module}</p>
                      <p className="text-xs text-[var(--muted)]">{moduleIds.length} permissions</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!canUpdate || noneSelected}
                        onClick={() => {
                          setDraftIds(selectAllModule(modulePermissions) as any);
                        }}
                      >
                        Select all
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canUpdate || allSelected}
                        onClick={() => {
                          setDraftIds(clearModule(modulePermissions) as any);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--line)]">
                    {modulePermissions.map((p: any) => {
                      const checked = isChecked(p);
                      // If we have draft changes, prefer draft state.
                      const permId = String(p.id ?? p.permissionId ?? '');
                      const checkedFromDraft = permId ? effectiveSet.has(permId) : checked;

                      return (
                        <div key={permId || p.slug} className="flex items-center justify-between px-4 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name ?? p.slug}</p>
                            {p.slug ? <p className="truncate text-xs text-[var(--muted)]">{p.slug}</p> : null}
                          </div>
                          <Checkbox
                            checked={checkedFromDraft}
                            disabled={!canUpdate}
                            onChange={(next) => togglePermission(p, next)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assignedQuery.isError ? (
        <div className="mt-4">
          <EmptyState title="Could not load role permissions" description="Try refreshing." />
        </div>
      ) : null}
    </div>
  );
}
