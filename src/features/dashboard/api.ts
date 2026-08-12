import { api } from '@/shared/api/client';

export type DashboardStats = {
  totalUsers?: number;
  totalVendors?: number;
  pendingVendors?: number;
  approvedVendors?: number;
  totalProducts?: number;
  pendingProducts?: number;
  totalOrders?: number;
  [key: string]: unknown;
};

export type DashboardKpi = {
  key: string;
  label: string;
  value: number;
};

const KPI_LABELS: Record<string, string> = {
  totalUsers: 'Total users',
  totalVendors: 'Total vendors',
  pendingVendors: 'Pending vendors',
  approvedVendors: 'Approved vendors',
  totalProducts: 'Total products',
  pendingProducts: 'Pending products',
  totalOrders: 'Total orders',
};

/** Backend returns a flat stats object, not `{ kpis: [] }`. */
export function toKpiCards(stats: DashboardStats | null | undefined): DashboardKpi[] {
  if (!stats || typeof stats !== 'object') return [];

  const preferred = [
    'totalOrders',
    'totalUsers',
    'totalVendors',
    'totalProducts',
    'pendingVendors',
    'approvedVendors',
    'pendingProducts',
  ];

  const cards: DashboardKpi[] = [];

  for (const key of preferred) {
    if (!(key in stats)) continue;
    const raw = stats[key];
    const value = Number(raw);
    cards.push({
      key,
      label: KPI_LABELS[key] ?? key,
      value: Number.isFinite(value) ? value : 0,
    });
  }

  // Catch any extra numeric fields the API may add later.
  for (const [key, raw] of Object.entries(stats)) {
    if (preferred.includes(key)) continue;
    if (typeof raw !== 'number') continue;
    cards.push({
      key,
      label: KPI_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      value: raw,
    });
  }

  return cards;
}

export async function getDashboard(): Promise<DashboardStats> {
  const { data } = await api.get('/api/v1/admin/dashboard');
  return (data?.data ?? data) as DashboardStats;
}

/**
 * Dashboard endpoint has no recent-orders list.
 * Analytics overview includes `recentOrders` (requires `analytics.view`).
 */
export { getRecentOrders as getRecentOrdersFromAnalytics } from '@/features/analytics/api';
