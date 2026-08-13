import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { isForbidden } from '@/shared/lib/permissions';
import { useAuthStore } from '@/shared/stores/auth-store';
import { getSettingsGroup, updateSettingsGroup } from '../api';

function inferType(key: string, value: unknown): 'text' | 'number' | 'boolean' | 'password' {
  if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) return 'password';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'text';
}

export function SettingsGroupPage() {
  const { slug = '' } = useParams();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasPermission('settings.manage'));

  const q = useQuery({
    queryKey: ['admin', 'settings', 'group', slug],
    queryFn: () => getSettingsGroup(slug),
    enabled: Boolean(slug),
  });

  const group = q.data;
  const values = group?.values ?? {};
  const entries = Object.entries(values as Record<string, unknown>);

  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!q.isSuccess) return;
    setDraft(values);
  }, [q.isSuccess, values]);

  const updateMutation = useMutation({
    mutationFn: async () => updateSettingsGroup(slug, draft),
    onSuccess: async () => {
      toast({ title: 'Settings updated', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'group', slug] });
    },
    onError: (err) => toast({ title: 'Update failed', description: getErrorMessage(err), tone: 'error' }),
  });

  const groupTitle = useMemo(() => group?.category?.name ?? 'Settings group', [group]);

  return (
    <div>
      <PageHeader title={groupTitle} description="Dynamic form generated from API values." />

      {q.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : q.isError && isForbidden(q.error) ? (
        <ForbiddenState error={q.error} fallback="settings.view" />
      ) : q.isError ? (
        <EmptyState title="Could not load settings" description="Try refreshing." />
      ) : entries.length === 0 ? (
        <EmptyState title="No settings values" description="The backend returned empty group values." />
      ) : (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {entries.map(([key, value]) => {
              const inferred = inferType(key, value);

              if (inferred === 'boolean') {
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)]/60 p-3"
                  >
                    <span className="text-sm text-[var(--muted)]">{key}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(draft[key])}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                  </label>
                );
              }

              const inputType = inferred === 'password' ? 'password' : inferred === 'number' ? 'number' : 'text';
              return (
                <Input
                  key={key}
                  label={key}
                  type={inputType}
                  value={draft[key] as any}
                  placeholder={value === null || value === undefined ? '' : String(value)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (inferred === 'number') setDraft((prev) => ({ ...prev, [key]: raw === '' ? '' : Number(raw) }));
                    else setDraft((prev) => ({ ...prev, [key]: raw }));
                  }}
                />
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(values)} disabled={updateMutation.isPending}>
              Reset
            </Button>
            <Button className='cursor-pointer' loading={updateMutation.isPending} disabled={!canManage} onClick={() => void updateMutation.mutateAsync()}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
