import { PageHeader } from '@/shared/components/ui/PageHeader';

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader
        title={title}
        description="This module is scaffolded and will be implemented next in the build order."
      />
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/60 p-8 text-sm text-[var(--muted)]">
        Coming up after Auth: RBAC → Dashboard → Analytics → Profile → Settings.
      </div>
    </div>
  );
}
