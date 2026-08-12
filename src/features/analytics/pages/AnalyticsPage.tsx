import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { isForbidden } from '@/shared/lib/permissions';
import { useAuthStore } from '@/shared/stores/auth-store';
import { getAnalyticsSnapshot } from '../api';

type PeriodKey = 'today' | 'yesterday' | '7d' | '30d' | '90d' | '12m' | 'all' | 'custom';

function formatCurrency(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

function RankedList({
  title,
  items,
  valueKey,
  nameKey,
  format = 'number',
}: {
  title: string;
  items: any[];
  valueKey: string;
  nameKey: string;
  format?: 'number' | 'currency';
}) {
  const max = Math.max(...items.map((i) => Number(i[valueKey]) || 0), 1);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
        <p className="font-semibold">{title}</p>
        <p className="mt-3 text-sm text-[var(--muted)]">No rows for this period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
      <p className="font-semibold">{title}</p>
      <ol className="mt-3 space-y-3">
        {items.slice(0, 8).map((item, index) => {
          const value = Number(item[valueKey]) || 0;
          const name = item[nameKey] ?? item.title ?? item.fullName ?? item.shopName ?? '—';
          return (
            <li key={item.uuid ?? item.productId ?? item.vendorId ?? item.userId ?? index}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="mr-2 text-[var(--muted)]">{index + 1}.</span>
                  {name}
                </span>
                <span className="shrink-0 font-medium">
                  {format === 'currency' ? formatCurrency(value) : formatNumber(value)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.max(6, (value / max) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AnalyticsPage() {
  const canView = useAuthStore((s) => s.hasPermission('analytics.view'));
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [metric, setMetric] = useState<'orders' | 'revenue'>('orders');

  const params = useMemo(() => {
    if (period === 'custom') {
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
        groupBy: 'day',
      };
    }
    return { period, groupBy: 'day' };
  }, [period, customStart, customEnd]);

  const query = useQuery({
    queryKey: ['admin', 'analytics', params],
    queryFn: () => getAnalyticsSnapshot(params),
    enabled: canView,
    placeholderData: (prev) => prev,
  });

  const snapshot = query.data ?? {};
  const timeseries = Array.isArray(snapshot.timeseries) ? snapshot.timeseries : [];
  const chartData = timeseries.map((p: any) => ({
    label: p.date,
    orders: p.orders,
    revenue: p.revenue,
  }));

  const summary = snapshot.summary ?? {};
  const topProducts = snapshot.topProducts ?? [];
  const topVendors = snapshot.vendors ?? snapshot.topVendors ?? [];
  const topCustomers = snapshot.topCustomers ?? [];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Marketplace snapshot — timeseries, period filter, and ranked products / vendors / customers."
      />

      <div className="mb-4 flex min-h-[52px] flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['today', 'yesterday', '7d', '30d', '90d', '12m', 'all'] as PeriodKey[]).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={period === k ? 'primary' : 'secondary'}
              onClick={() => setPeriod(k)}
            >
              {k}
            </Button>
          ))}
          <Button
            size="sm"
            variant={period === 'custom' ? 'primary' : 'secondary'}
            onClick={() => setPeriod('custom')}
          >
            Custom
          </Button>
        </div>

        {period === 'custom' ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3"
            />
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3"
            />
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={metric === 'orders' ? 'primary' : 'secondary'}
            onClick={() => setMetric('orders')}
          >
            Orders
          </Button>
          <Button
            size="sm"
            variant={metric === 'revenue' ? 'primary' : 'secondary'}
            onClick={() => setMetric('revenue')}
          >
            Revenue
          </Button>
        </div>
      </div>

      {!canView ? (
        <ForbiddenState fallback="analytics.view" />
      ) : query.isLoading && !query.data ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-[320px] w-full" />
          <div className="grid gap-3 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      ) : query.isError && isForbidden(query.error) ? (
        <ForbiddenState error={query.error} fallback="analytics.view" />
      ) : query.isError ? (
        <EmptyState title="Could not load analytics" description="Try another period or refresh." />
      ) : (
        <div className="space-y-6" style={{ minHeight: 640 }}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">New orders</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(summary.newOrders)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Growth {formatNumber(summary.ordersGrowthPct)}%
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">Revenue</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.revenue)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Growth {formatNumber(summary.revenueGrowthPct)}%
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">New customers</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(summary.newCustomers)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                AOV {formatCurrency(summary.averageOrderValue)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Timeseries</p>
              {query.isFetching ? (
                <span className="text-xs text-[var(--muted)]">Updating…</span>
              ) : null}
            </div>
            <div className="h-[320px]">
              {chartData.length === 0 ? (
                <EmptyState
                  title="No points in this range"
                  description="Pick 7d / 30d / 90d or a custom range with data."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: unknown) =>
                        metric === 'revenue' ? formatCurrency(value) : formatNumber(value)
                      }
                    />
                    <Line type="monotone" dataKey={metric} stroke="#0f6e56" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <RankedList
              title="Top products"
              items={topProducts}
              nameKey="title"
              valueKey="revenue"
              format="currency"
            />
            <RankedList
              title="Top vendors"
              items={topVendors}
              nameKey="shopName"
              valueKey="sales"
              format="currency"
            />
            <RankedList
              title="Top customers"
              items={topCustomers}
              nameKey="fullName"
              valueKey="spent"
              format="currency"
            />
          </div>
        </div>
      )}
    </div>
  );
}
