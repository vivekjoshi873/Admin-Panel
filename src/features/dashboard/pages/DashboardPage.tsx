import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { getDashboard, getRecentOrdersFromAnalytics, toKpiCards } from '../api';

function formatNumber(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatMoney(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(value)}</p>
    </div>
  );
}

function KpiSkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-20" />
        </div>
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/60">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-56" />
      </div>
      <div className="divide-y divide-[var(--line)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_140px_140px]">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getDashboard,
  });

  const ordersQuery = useQuery({
    queryKey: ['admin', 'analytics', 'recent-orders'],
    queryFn: getRecentOrdersFromAnalytics,
  });

  const kpis = toKpiCards(dashboardQuery.data);
  const recentOrders = ordersQuery.data ?? [];

  const refresh = () => {
    void dashboardQuery.refetch();
    void ordersQuery.refetch();
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Marketplace overview — users, vendors, products, and recent orders."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            loading={dashboardQuery.isFetching || ordersQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      <div className="space-y-6">
        {dashboardQuery.isLoading ? (
          <KpiSkeletonGrid />
        ) : dashboardQuery.isError ? (
          <EmptyState
            title="Could not load dashboard KPIs"
            description="Check your connection or try Refresh."
            actionLabel="Retry"
            onAction={refresh}
          />
        ) : kpis.length === 0 ? (
          <EmptyState
            title="No KPI data yet"
            description="The dashboard API returned no stats. Values will appear when the marketplace has activity."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <KpiCard key={k.key} label={k.label} value={k.value} />
            ))}
          </div>
        )}

        {ordersQuery.isLoading ? (
          <OrdersSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/60">
            <div className="border-b border-[var(--line)] px-4 py-3">
              <p className="font-semibold">Recent orders</p>
              <p className="text-sm text-[var(--muted)]">Latest marketplace orders (last 30 days).</p>
            </div>

            {ordersQuery.isError ? (
              <div className="p-4">
                <EmptyState
                  title="Could not load recent orders"
                  description="Orders come from analytics when the dashboard endpoint has no order list."
                  actionLabel="Retry"
                  onAction={() => void ordersQuery.refetch()}
                />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No recent orders"
                  description="Once customers place orders, they will show up here."
                />
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-[1fr_160px_140px_140px] gap-2 bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    <span>Order</span>
                    <span>Customer</span>
                    <span>Status</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="divide-y divide-[var(--line)]">
                    {recentOrders.slice(0, 10).map((o: any) => (
                      <div
                        key={o.uuid ?? o.id ?? o.orderNumber}
                        className="grid grid-cols-[1fr_160px_140px_140px] items-center gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{o.orderNumber ?? o.uuid ?? o.id}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                          </p>
                        </div>
                        <span className="truncate text-[var(--muted)]">
                          {o.customer ?? o.customerName ?? '—'}
                        </span>
                        <span>{o.status ?? '—'}</span>
                        <span className="text-right font-medium">
                          {formatMoney(o.amount ?? o.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="divide-y divide-[var(--line)] sm:hidden">
                  {recentOrders.slice(0, 10).map((o: any) => (
                    <div key={o.uuid ?? o.id ?? o.orderNumber} className="space-y-1 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{o.orderNumber ?? o.uuid ?? o.id}</p>
                        <p className="text-sm font-medium">{formatMoney(o.amount ?? o.total)}</p>
                      </div>
                      <p className="text-sm text-[var(--muted)]">
                        {o.customer ?? o.customerName ?? '—'} · {o.status ?? '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
