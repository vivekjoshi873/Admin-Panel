import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import {
  getAnalyticsInventory,
  getAnalyticsCustomers,
  getAnalyticsOrders,
  getAnalyticsProducts,
  getAnalyticsRevenue,
  getAnalyticsTimeseries,
} from '../api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

type PeriodKey = '7d' | '30d' | '90d' | 'custom';

function formatCurrency(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatNumber(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [groupBy] = useState<'day' | 'week' | 'month'>('day');

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const queryParams = useMemo(() => {
    if (period !== 'custom') {
      return { period, groupBy };
    }
    return {
      period: 'custom',
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
      groupBy,
    };
  }, [period, groupBy, customStart, customEnd]);

  const timeseriesQuery = useQuery({
    queryKey: ['admin', 'analytics', 'timeseries', queryParams],
    queryFn: () => getAnalyticsTimeseries(queryParams as any),
  });

  const ordersQuery = useQuery({
    queryKey: ['admin', 'analytics', 'orders', queryParams],
    queryFn: () => getAnalyticsOrders(queryParams as any),
  });

  const revenueQuery = useQuery({
    queryKey: ['admin', 'analytics', 'revenue', queryParams],
    queryFn: () => getAnalyticsRevenue(queryParams as any),
  });

  const productsQuery = useQuery({
    queryKey: ['admin', 'analytics', 'products', queryParams],
    queryFn: () => getAnalyticsProducts(queryParams as any),
  });

  const customersQuery = useQuery({
    queryKey: ['admin', 'analytics', 'customers', queryParams],
    queryFn: () => getAnalyticsCustomers(queryParams as any),
  });

  const inventoryQuery = useQuery({
    queryKey: ['admin', 'analytics', 'inventory'],
    queryFn: getAnalyticsInventory,
  });

  const data = timeseriesQuery.data ?? [];

  const hasData = Array.isArray(data) && data.length > 0;

  const [metric, setMetric] = useState<'orders' | 'revenue'>('orders');

  const chartData = useMemo(() => {
    return (data ?? []).map((p: any) => ({
      label: p.date,
      orders: p.orders,
      revenue: p.revenue,
    }));
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Timeseries + overview stats for orders, revenue, customers, products, and inventory."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d'] as PeriodKey[]).map((k) => (
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm text-[var(--muted)]">Start</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3"
            />
            <label className="text-sm text-[var(--muted)]">End</label>
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

      {(timeseriesQuery.isLoading || ordersQuery.isLoading || revenueQuery.isLoading) ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
            <Skeleton className="h-[320px] w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
      ) : !hasData ? (
        <EmptyState title="No data for this range" description="Try another period selection." />
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <p className="font-semibold">Timeseries</p>
              <p className="text-sm text-[var(--muted)]">Metric: {metric}</p>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) =>
                      metric === 'revenue' ? formatCurrency(value) : formatNumber(value)
                    }
                  />
                  <Line type="monotone" dataKey={metric} stroke="#0f6e56" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">New orders</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(ordersQuery.data?.newOrders)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Growth: {formatNumber(ordersQuery.data?.growthPct)}%</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">Gross sales</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(revenueQuery.data?.grossSales)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Paid revenue: {formatCurrency(revenueQuery.data?.paidRevenue)}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">New customers</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(customersQuery.data?.newCustomers)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Active buyers: {formatNumber(customersQuery.data?.activeBuyersInRange)}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">Total products</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(productsQuery.data?.totalProducts)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Featured: {formatNumber(productsQuery.data?.featuredProducts)}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">Stock on hand</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(inventoryQuery.data?.stockOnHand)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Low stock: {formatNumber(inventoryQuery.data?.lowStockVariants)}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 p-4">
              <p className="text-sm text-[var(--muted)]">Refunded amount</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(revenueQuery.data?.refundedAmount)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">AOV: {formatCurrency(revenueQuery.data?.averageOrderValue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
