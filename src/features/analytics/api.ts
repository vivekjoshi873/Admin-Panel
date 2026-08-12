import { api } from '@/shared/api/client';

/** Swagger: period enum on /admin/analytics* */
export type AnalyticsPeriod =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | '12m'
  | 'all';

export type AnalyticsGroupBy = 'day' | 'week' | 'month';

export type AnalyticsParams = {
  period?: AnalyticsPeriod | string;
  startDate?: string;
  endDate?: string;
  groupBy?: AnalyticsGroupBy | string;
};

function unwrap(payload: unknown): any {
  const root = payload as { data?: unknown };
  return (root?.data ?? payload) as any;
}

export async function getAnalyticsSnapshot(params?: AnalyticsParams): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics', { params });
  return unwrap(data);
}

export async function getAnalyticsOrders(params?: AnalyticsParams): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/orders', { params });
  return unwrap(data);
}

export async function getAnalyticsRevenue(params?: AnalyticsParams): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/revenue', { params });
  return unwrap(data);
}

export async function getAnalyticsInventory(): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/inventory');
  return unwrap(data);
}

export async function getAnalyticsProducts(): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/products');
  return unwrap(data);
}

export async function getAnalyticsCustomers(params?: AnalyticsParams): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/customers', { params });
  return unwrap(data);
}

export async function getAnalyticsTimeseries(params?: AnalyticsParams): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/timeseries', { params });
  return unwrap(data);
}

/** Prefer overview `recentOrders`; used by Dashboard. */
export async function getRecentOrders(period: AnalyticsPeriod = '30d'): Promise<any[]> {
  const body = await getAnalyticsSnapshot({ period });
  const list = body?.recentOrders ?? body?.data?.recentOrders ?? [];
  return Array.isArray(list) ? list : [];
}
