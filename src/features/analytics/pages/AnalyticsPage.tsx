import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { ForbiddenState } from '@/shared/components/ui/ForbiddenState';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { isForbidden } from '@/shared/lib/permissions';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  type AnalyticsPeriod,
  getAnalyticsCustomers,
  getAnalyticsInventory,
  getAnalyticsProducts,
  getAnalyticsSnapshot,
  getAnalyticsTimeseries,
} from '../api';
import { parse } from 'date-fns';

type PeriodKey = AnalyticsPeriod | 'custom';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '12m', label: '12m' },
  { value: 'all', label: 'All' },
];

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

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [metric, setMetric] = useState<'orders' | 'revenue'>('orders');

  const params = useMemo(() => {
    if (period === 'custom') {
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
        groupBy: 'day' as const,
      };
    }
    return { period, groupBy: 'day' as const };
  }, [period, customStart, customEnd]);

  // Always hit the API (same pattern as Roles/Users). Show Forbidden only on real 403.
  const snapshotQuery = useQuery({
    queryKey: queryKeys.analytics.root(params),
    queryFn: () => getAnalyticsSnapshot(params),
    placeholderData: (prev) => prev,
  });

  const timeseriesQuery = useQuery({
    queryKey: queryKeys.analytics.timeseries(params),
    queryFn: () => getAnalyticsTimeseries(params),
    placeholderData: (prev) => prev,
  });

  const inventoryQuery = useQuery({
    queryKey: queryKeys.analytics.inventory,
    queryFn: getAnalyticsInventory,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.analytics.products,
    queryFn: getAnalyticsProducts,
  });

  const customersQuery = useQuery({
    queryKey: queryKeys.analytics.customers(params),
    queryFn: () => getAnalyticsCustomers(params),
  });

  const snapshot = snapshotQuery.data ?? {};
  const summary = snapshot.summary ?? {};
  const topProducts = snapshot.topProducts ?? [];
  const topVendors = snapshot.vendors ?? snapshot.topVendors ?? [];
  const topCustomers = snapshot.topCustomers ?? [];

  const timeseriesRaw =
    (Array.isArray(snapshot.timeseries) && snapshot.timeseries.length
      ? snapshot.timeseries
      : null) ??
    (Array.isArray(timeseriesQuery.data?.timeseries)
      ? timeseriesQuery.data.timeseries
      : Array.isArray(timeseriesQuery.data)
        ? timeseriesQuery.data
        : []);

  const chartData = timeseriesRaw.map((p: any) => ({
    label: p.date ?? p.label,
    orders: p.orders ?? p.value,
    revenue: p.revenue ?? p.grossRevenue ?? p.value,
  }));

  const inventory = inventoryQuery.data ?? {};
  const products = productsQuery.data ?? {};
  const customers = customersQuery.data ?? {};

  const isLoading =
    snapshotQuery.isLoading && !snapshotQuery.data && timeseriesQuery.isLoading && !timeseriesQuery.data;

  const isForbiddenError =
    (snapshotQuery.isError && isForbidden(snapshotQuery.error)) ||
    (timeseriesQuery.isError && isForbidden(timeseriesQuery.error));

  const hardError =
    snapshotQuery.isError && !isForbidden(snapshotQuery.error) && !snapshotQuery.data;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Marketplace snapshot — timeseries, period filter, and ranked products / vendors / customers."
      />

      <div className="mb-4 flex min-h-[52px] flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={period === opt.value ? 'primary' : 'secondary'}
              onClick={() => setPeriod(opt.value)}
              className="cursor-pointer"
            >
              {opt.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={period === 'custom' ? 'primary' : 'secondary'}
            onClick={() => setPeriod('custom')}
            className="cursor-pointer"
          >
            Custom
          </Button>
        </div>

        {period === 'custom' ? (
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              value={customStart}
              onChange={setCustomStart}
              placeholder="Start date"
              toDate={customEnd ? parse(customEnd, 'yyyy-MM-dd', new Date()) : undefined}
            />
            <span className="text-sm text-[var(--muted)]">to</span>
            <DatePicker
              value={customEnd}
              onChange={setCustomEnd}
              placeholder="End date"
              fromDate={customStart ? parse(customStart, 'yyyy-MM-dd', new Date()) : undefined}
            />
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={metric === 'orders' ? 'primary' : 'secondary'}
            onClick={() => setMetric('orders')}
            className="cursor-pointer"
          >
            Orders
          </Button>
          <Button
            size="sm"
            variant={metric === 'revenue' ? 'primary' : 'secondary'}
            onClick={() => setMetric('revenue')}
            className="cursor-pointer"
          >
            Revenue
          </Button>
        </div>
      </div>

      {isLoading ? (
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
      ) : isForbiddenError ? (
        <ForbiddenState
          error={snapshotQuery.error ?? timeseriesQuery.error}
          fallback="analytics.view"
        />
      ) : hardError ? (
        <EmptyState title="Could not load analytics" description="Try another period or refresh." />
      ) : (
        <div className="space-y-6" style={{ minHeight: 640 }}>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="New orders"
              value={formatNumber(summary.newOrders ?? customers.newOrders)}
              hint={`Growth ${formatNumber(summary.ordersGrowthPct)}%`}
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(summary.revenue)}
              hint={`Growth ${formatNumber(summary.revenueGrowthPct)}%`}
            />
            <StatCard
              label="New customers"
              value={formatNumber(summary.newCustomers ?? customers.newCustomers)}
              hint={`AOV ${formatCurrency(summary.averageOrderValue)}`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Catalogue"
              value={formatNumber(products.total ?? products.totalProducts ?? summary.totalProducts)}
              hint={`Published ${formatNumber(products.published ?? products.publishedCount)}`}
            />
            <StatCard
              label="In stock"
              value={formatNumber(inventory.inStock ?? inventory.inStockVariants)}
              hint={`Low ${formatNumber(inventory.lowStock ?? inventory.lowStockVariants)} · Out ${formatNumber(inventory.outOfStock ?? inventory.outOfStockVariants)}`}
            />
            <StatCard
              label="Buyers in range"
              value={formatNumber(customers.uniqueBuyers ?? customers.totalCustomers ?? summary.uniqueBuyers)}
              hint={`Base ${formatNumber(customers.totalCustomers)}`}
            />
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Timeseries</p>
              {snapshotQuery.isFetching || timeseriesQuery.isFetching ? (
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
                    <Line
                      type="monotone"
                      dataKey={metric}
                      stroke="#0f6e56"
                      dot={false}
                      strokeWidth={2}
                    />
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

          <p className="text-xs text-[var(--muted)]">
            Need access? Assign <code className="font-mono">analytics.view</code> in{' '}
            <Link to="/rbac/matrix" className="underline">
              Permission matrix
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
