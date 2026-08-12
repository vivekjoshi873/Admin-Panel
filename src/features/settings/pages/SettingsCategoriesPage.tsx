import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { getSettingsCategories } from '../api';

export function SettingsCategoriesPage() {
  const q = useQuery({
    queryKey: ['admin', 'settings', 'categories'],
    queryFn: getSettingsCategories,
  });

  const categories = q.data ?? [];

  return (
    <div>
      <PageHeader title="Settings" description="Choose a settings group to edit." />

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : q.isError ? (
        <EmptyState title="Could not load settings" description="Try refreshing." />
      ) : categories.length === 0 ? (
        <EmptyState title="No settings groups" description="No categories returned from the backend." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c: any) => (
            <Link
              key={c.uuid ?? c.id ?? c.slug}
              to={`/settings/group/${c.slug}`}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <p className="font-semibold">{c.name ?? c.slug}</p>
              {c.description ? <p className="mt-1 text-sm text-[var(--muted)]">{c.description}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
