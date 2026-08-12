import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { ConfirmDelete } from '@/features/rbac/components/ConfirmDelete';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { isForbidden } from '@/shared/lib/permissions';
import { useAuthStore } from '@/shared/stores/auth-store';
import {
  createSettingsCategory,
  deleteSettingsCategory,
  getSettingsCategories,
} from '../api';

export function SettingsCategoriesPage() {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasPermission('settings.manage'));
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const q = useQuery({
    queryKey: ['admin', 'settings', 'categories'],
    queryFn: getSettingsCategories,
  });

  const createMutation = useMutation({
    mutationFn: () => createSettingsCategory({ name, slug: slug || undefined }),
    onSuccess: async () => {
      setName('');
      setSlug('');
      toast({ title: 'Category created', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err) => toast({ title: 'Create failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSettingsCategory(id),
    onSuccess: async () => {
      toast({ title: 'Category deleted', tone: 'info' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err) => toast({ title: 'Delete failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const categories = q.data ?? [];

  return (
    <div>
      <PageHeader title="Settings" description="Sidebar groups — open a category to edit its dynamic form." />

      {canManage ? (
        <form
          className="mb-6 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate();
          }}
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Company" />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="company" />
          <div className="flex items-end">
            <Button type="submit" loading={createMutation.isPending} disabled={!name.trim()}>
              Add category
            </Button>
          </div>
        </form>
      ) : null}

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : q.isError && isForbidden(q.error) ? (
        <ForbiddenState error={q.error} fallback="settings.view" />
      ) : q.isError ? (
        <EmptyState title="Could not load settings" description="Try refreshing." />
      ) : categories.length === 0 ? (
        <EmptyState title="No settings groups" description="Create a category or wait for the API to return groups." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c: any) => {
            const id = String(c.uuid ?? c.id ?? '');
            return (
              <div
                key={id || c.slug}
                className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4"
              >
                <Link to={`/settings/group/${c.slug}`} className="hover:underline">
                  <p className="font-semibold">{c.name ?? c.slug}</p>
                  {c.description ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{c.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--muted)]">{c.slug}</p>
                  )}
                </Link>
                {canManage && id ? (
                  <div className="mt-3">
                    <ConfirmDelete
                      label="Delete"
                      title="Delete category?"
                      description="This removes the settings group."
                      onConfirm={() => deleteMutation.mutateAsync(id)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
