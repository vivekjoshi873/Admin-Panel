import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { isForbidden } from '@/shared/lib/permissions';
import { queryKeys } from '@/shared/lib/query-keys';
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
    <Card className="group transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgb(20_24_22_/_0.08)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
        <span className="rounded-lg bg-[var(--accent-soft)] p-1.5 text-[var(--accent)]">
          <TrendingUp className="size-3.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">{formatNumber(value)}</p>
    </Card>
  );
}

function KpiSkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-20" />
        </Card>
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
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
    </Card>
  );
}

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.root,
    queryFn: getDashboard,
  });

  // Always hit analytics for recent orders; show Forbidden only on real 403.
  const ordersQuery = useQuery({
    queryKey: ['admin', 'analytics', 'recent-orders'],
    queryFn: () => getRecentOrdersFromAnalytics('30d'),
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
            className="cursor-pointer"
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
        ) : dashboardQuery.isError && isForbidden(dashboardQuery.error) ? (
          <ForbiddenState error={dashboardQuery.error} fallback="dashboard" />
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
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]/75 shadow-[0_10px_30px_rgb(20_24_22_/_0.04)] backdrop-blur">
            <div className="border-b border-[var(--line)] px-4 py-4">
              <p className="font-semibold tracking-tight">Recent orders</p>
              <p className="text-sm text-[var(--muted)]">Latest marketplace orders (last 30 days).</p>
            </div>

            {ordersQuery.isError && isForbidden(ordersQuery.error) ? (
              <div className="p-4">
                <ForbiddenState error={ordersQuery.error} fallback="analytics.view" />
                <div className="mt-3">
                  <Link
                    to="/rbac/matrix"
                    className="inline-flex h-8 items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  >
                    Open permission matrix
                  </Link>
                </div>
              </div>
            ) : ordersQuery.isError ? (
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
